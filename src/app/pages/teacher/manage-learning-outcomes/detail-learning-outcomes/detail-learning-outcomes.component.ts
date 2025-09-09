import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TeacherProgressService, MaterialProgress, ClassMaterialsProgressResponse } from 'src/app/service/teacher-progress.service';

@Component({
  selector: 'app-detail-learning-outcomes',
  templateUrl: './detail-learning-outcomes.component.html',
  styleUrls: ['./detail-learning-outcomes.component.css']
})
export class DetailLearningOutcomesComponent implements OnInit, OnDestroy {

  // ✅ UPDATED: Properties untuk data dinamis
  classId: string = '';
  classInfo: any = null;
  materials: MaterialProgress[] = [];
  filteredMaterials: MaterialProgress[] = [];
  keyword: string = '';
  loading: boolean = false;
  errorMsg: string = '';

  // Sort dan filter
  sortBy: 'name' | 'progress' | 'date' = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedKategori: string = 'all';
  uniqueKategoris: string[] = [];

  // ✅ TAMBAH: Computed properties untuk template
  kategoriOptions: { value: string; label: string }[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private teacherProgressService: TeacherProgressService
  ) { }

  ngOnInit(): void {
    // Get classId from route params
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
    this.classId = params['id']; // Bukan 'classId'
    if (this.classId) {
      this.loadClassMaterialsProgress();
    }
  });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ TAMBAH: Load data materi dari backend
  loadClassMaterialsProgress(): void {
    this.loading = true;
    this.errorMsg = '';

    this.teacherProgressService.getClassMaterialsProgress(this.classId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ClassMaterialsProgressResponse) => {
          console.log('✅ Class materials progress response:', response);
          
          if (response.success) {
            this.classInfo = response.data.kelas_info;
            this.materials = response.data.materi_list || [];
            this.filteredMaterials = [...this.materials];
            
            // Get unique kategoris untuk filter
            this.uniqueKategoris = this.teacherProgressService.getUniqueKategoris(this.materials);
            
            // ✅ Build kategori options untuk template
            this.buildKategoriOptions();
            
            // Show message if no materials found
            if (this.materials.length === 0) {
              this.errorMsg = 'Belum ada materi yang terkait dengan kelas ini.';
            }
          } else {
            this.errorMsg = response.message || 'Gagal memuat data materi.';
            this.materials = [];
            this.filteredMaterials = [];
          }
          
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error loading class materials:', error);
          
          let errorMessage = 'Gagal memuat data materi kelas. ';
          
          if (error.status === 401) {
            errorMessage += 'Sesi login telah berakhir. Silakan login ulang.';
          } else if (error.status === 403) {
            errorMessage += 'Anda tidak memiliki akses untuk melihat data ini.';
          } else if (error.status === 404) {
            errorMessage += 'Kelas tidak ditemukan.';
          } else if (error.status === 0) {
            errorMessage += 'Tidak dapat terhubung ke server.';
          } else {
            errorMessage += 'Silakan coba lagi.';
          }
          
          this.errorMsg = errorMessage;
          this.materials = [];
          this.filteredMaterials = [];
          this.loading = false;
        }
      });
  }

  // ✅ TAMBAH: Build kategori options
  buildKategoriOptions(): void {
    this.kategoriOptions = [
      { value: 'all', label: 'Semua Kategori' }
    ];
    
    this.uniqueKategoris.forEach(kategori => {
      this.kategoriOptions.push({ value: kategori, label: kategori });
    });
  }

  // ✅ UPDATED: Search function
  onSearch(): void {
    this.applyFilters();
  }

  // ✅ TAMBAH: Apply filters dan search
  applyFilters(): void {
    let filtered = [...this.materials];

    // Filter by kategori
    if (this.selectedKategori !== 'all') {
      filtered = this.teacherProgressService.filterMaterialsByKategori(filtered, this.selectedKategori);
    }

    // Filter by search keyword
    if (this.keyword.trim()) {
      const searchTerm = this.keyword.toLowerCase().trim();
      filtered = filtered.filter(material => 
        material.judul_materi.toLowerCase().includes(searchTerm) ||
        material.kategori_materi.toLowerCase().includes(searchTerm)
      );
    }

    this.filteredMaterials = filtered;
  }

  lihatDetail(material: MaterialProgress): void {
    // Navigate to students progress for this material dengan classId dan materiId
    this.router.navigate([
      '/guru/hasil-belajar/detail-materi-belajar', 
      this.classId, 
      'materials', 
      material._id, 
      'students'
    ]);
  }

  // ✅ TAMBAH: Back to manage learning outcomes
  backToManageLearningOutcomes(): void {
    this.router.navigate(['/guru/hasil-belajar']);
  }

  // ✅ TAMBAH: Refresh data
  refreshData(): void {
    this.loadClassMaterialsProgress();
  }

  // ✅ TAMBAH: Reset filters
  resetFilters(): void {
    this.keyword = '';
    this.selectedKategori = 'all';
    this.onSearch();
  }

  // ✅ TAMBAH: Sort functionality
  sortMaterials(criteria: 'name' | 'progress' | 'date'): void {
    if (this.sortBy === criteria) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = criteria;
      this.sortDirection = 'asc';
    }

    this.filteredMaterials = this.teacherProgressService.sortMaterials(this.filteredMaterials, criteria);
    
    if (this.sortDirection === 'desc') {
      this.filteredMaterials.reverse();
    }
  }

  // ✅ TAMBAH: Get sort icon
  getSortIcon(criteria: 'name' | 'progress' | 'date'): string {
    if (this.sortBy !== criteria) return 'fas fa-sort';
    return this.sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }

  // ✅ TAMBAH: Filter by kategori
  onKategoriChange(): void {
    this.applyFilters();
  }

  // ✅ TAMBAH: Helper methods
  getTotalMaterialsCount(): number {
    return this.materials.length;
  }

  getFilteredMaterialsCount(): number {
    return this.filteredMaterials.length;
  }

  getAverageProgress(): number {
    if (this.materials.length === 0) return 0;
    const total = this.materials.reduce((sum, material) => sum + material.persentase_selesai, 0);
    return Math.round(total / this.materials.length);
  }

  getTotalStudentsCompleted(): number {
    return this.materials.reduce((total, material) => total + material.siswa_selesai, 0);
  }

  // ✅ TAMBAH: Check if filters applied
  hasFiltersApplied(): boolean {
    return this.keyword.trim() !== '' || this.selectedKategori !== 'all';
  }

  // ✅ TAMBAH: Get progress color dan text
  getProgressColor(percentage: number): string {
    return this.teacherProgressService.getProgressColor(percentage);
  }

  getProgressText(percentage: number): string {
    return this.teacherProgressService.getProgressText(percentage);
  }

  // ✅ TAMBAH: Get kategori icon
  getKategoriIcon(kategori: string): string {
    return this.teacherProgressService.getKategoriMateriIcon(kategori);
  }

  // ✅ TAMBAH: Format date
  formatDate(date: Date | string): string {
    return this.teacherProgressService.formatDateShort(date);
  }
}
