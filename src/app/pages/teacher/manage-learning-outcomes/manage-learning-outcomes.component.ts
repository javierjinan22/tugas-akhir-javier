import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TeacherProgressService, MaterialProgress, AllMaterialsProgressResponse } from 'src/app/service/teacher-progress.service';

@Component({
  selector: 'app-manage-learning-outcomes',
  templateUrl: './manage-learning-outcomes.component.html',
  styleUrls: ['./manage-learning-outcomes.component.css']
})
export class ManageLearningOutcomesComponent implements OnInit, OnDestroy {

  // ✅ UPDATE: Properties untuk data gabungan
  materials: Array<MaterialProgress & { kelas_info: any }> = [];
  filteredMaterials: Array<MaterialProgress & { kelas_info: any }> = [];
  
  // Filter options
  kelasList: Array<{ _id: string; nama_kelas: string; tahun_ajaran: string; total_siswa: number }> = [];
  tahunAjaranList: string[] = [];
  kategoriList: string[] = [];
  
  // Selected filters
  selectedKelas: string = 'all';
  selectedTahunAjaran: string = 'all';
  selectedKategori: string = 'all';
  keyword: string = '';
  
  // UI state
  loading: boolean = false;
  errorMsg: string = '';

  // School and teacher info
  sekolahInfo: any = null;
  guruInfo: any = null;

  // ✅ TAMBAH: Filter options untuk template
  kelasOptions: { value: string; label: string }[] = [];
  tahunAjaranOptions: { value: string; label: string }[] = [];
  kategoriOptions: { value: string; label: string }[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private teacherProgressService: TeacherProgressService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['filter'] === 'completed') {
        // Set filter untuk menampilkan hanya materi yang completed
        this.selectedKelas = 'all';
        this.selectedTahunAjaran = 'all';
        this.selectedKategori = 'all';
        // Load data dengan filter completed
        this.loadCompletedMaterials();
      } else {
        this.loadAllMaterialsProgress();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCompletedMaterials(): void {
    this.loading = true;
    this.teacherProgressService.getAllMaterialsProgress()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Filter hanya materi yang 100% completed
            const completedMaterials = response.data.materials.filter(
              material => material.persentase_selesai === 100
            );
            
            this.materials = completedMaterials;
            this.filteredMaterials = [...completedMaterials];
            
            // Set other data
            this.kelasList = response.data.kelas_list || [];
            this.tahunAjaranList = response.data.tahun_ajaran_list || [];
            this.kategoriList = response.data.kategori_list || [];
            this.sekolahInfo = response.data.sekolah_info;
            this.guruInfo = response.data.guru_info;
            
            this.buildFilterOptions();
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading completed materials:', error);
          this.loading = false;
          this.errorMsg = 'Gagal memuat data materi selesai.';
        }
      });
  }

  // ✅ UPDATE: Load semua data materi dengan info kelas
  loadAllMaterialsProgress(): void {
    this.loading = true;
    this.errorMsg = ''; // ✅ PERBAIKAN: Clear error message

    // Get current filters
    const filters = {
      kelas_id: this.selectedKelas,
      tahun_ajaran: this.selectedTahunAjaran,
      kategori: this.selectedKategori
    };

    this.teacherProgressService.getAllMaterialsProgress(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: AllMaterialsProgressResponse) => {
          console.log('✅ All materials progress response:', response);

          if (response.success) {
            this.materials = response.data.materials || [];
            this.filteredMaterials = [...this.materials];
            
            // Set filter options
            this.kelasList = response.data.kelas_list || [];
            this.tahunAjaranList = response.data.tahun_ajaran_list || [];
            this.kategoriList = response.data.kategori_list || [];
            
            // Set school and teacher info
            this.sekolahInfo = response.data.sekolah_info;
            this.guruInfo = response.data.guru_info;
            
            // Build filter options untuk template
            this.buildFilterOptions();
            
            // Apply search if keyword exists
            this.applyFilters();

            // ✅ PERBAIKAN: Jangan set error message jika materials kosong
            // Biarkan template yang handle empty state
            console.log('📊 Materials loaded:', this.materials.length);
          } else {
            this.errorMsg = response.message || 'Gagal memuat data materi.';
            this.materials = [];
            this.filteredMaterials = [];
          }

          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error loading all materials:', error);

          let errorMessage = 'Gagal memuat data hasil belajar. ';

          if (error.status === 401) {
            errorMessage += 'Sesi login telah berakhir. Silakan login ulang.';
          } else if (error.status === 403) {
            errorMessage += 'Anda tidak memiliki akses untuk melihat data ini.';
          } else if (error.status === 0) {
            errorMessage += 'Tidak dapat terhubung ke server.';
          } else {
            errorMessage += error.error?.message || error.message || 'Silakan coba lagi.';
          }

          this.errorMsg = errorMessage;
          this.materials = [];
          this.filteredMaterials = [];
          this.loading = false;
        }
      });
  }

  // ✅ TAMBAH: Build filter options untuk template
  buildFilterOptions(): void {
    // Kelas options
    this.kelasOptions = [
      { value: 'all', label: 'Semua Kelas' }
    ];
    this.kelasList.forEach(kelas => {
      this.kelasOptions.push({ 
        value: kelas._id, 
        label: `${kelas.nama_kelas} (${kelas.tahun_ajaran})` 
      });
    });

    // Tahun ajaran options
    this.tahunAjaranOptions = [
      { value: 'all', label: 'Semua Tahun Ajaran' }
    ];
    this.tahunAjaranList.forEach(tahun => {
      this.tahunAjaranOptions.push({ value: tahun, label: tahun });
    });

    // Kategori options
    this.kategoriOptions = [
      { value: 'all', label: 'Semua Kategori' }
    ];
    this.kategoriList.forEach(kategori => {
      this.kategoriOptions.push({ value: kategori, label: kategori });
    });
  }

  // ✅ TAMBAH: Apply filters dan search
  applyFilters(): void {
    let filtered = [...this.materials];

    // Filter by search keyword
    if (this.keyword.trim()) {
      const searchTerm = this.keyword.toLowerCase().trim();
      filtered = filtered.filter(material => 
        material.judul_materi.toLowerCase().includes(searchTerm) ||
        material.kategori_materi.toLowerCase().includes(searchTerm) ||
        material.kelas_info.nama_kelas.toLowerCase().includes(searchTerm)
      );
    }

    this.filteredMaterials = filtered;
  }

  // ✅ TAMBAH: Filter change handlers
  onKelasChange(): void {
    this.loadAllMaterialsProgress(); // Reload dengan filter baru
  }

  onTahunAjaranChange(): void {
    this.loadAllMaterialsProgress(); // Reload dengan filter baru
  }

  onKategoriChange(): void {
    this.loadAllMaterialsProgress(); // Reload dengan filter baru
  }

  onSearch(): void {
    this.applyFilters();
  }

  // ✅ UPDATE: Navigation ke detail students
  lihatDetailMateri(material: MaterialProgress & { kelas_info: any }): void {
    // Navigate to students progress untuk materi ini
    this.router.navigate([
      '/guru/hasil-belajar/detail-materi-belajar', 
      material.kelas_info._id, 
      'materials', 
      material._id, 
      'students'
    ]);
  }

  // ✅ TAMBAH: Reset filters
  resetFilters(): void {
    this.selectedKelas = 'all';
    this.selectedTahunAjaran = 'all';
    this.selectedKategori = 'all';
    this.keyword = '';
    this.loadAllMaterialsProgress();
  }

  // ✅ TAMBAH: Refresh data
  refreshData(): void {
    this.errorMsg = ''; // ✅ Clear error message saat refresh
    this.loadAllMaterialsProgress();
  }

  // ✅ TAMBAH: Helper methods
  getTotalMaterialsCount(): number {
    return this.materials ? this.materials.length : 0;
  }

  getFilteredMaterialsCount(): number {
    return this.filteredMaterials ? this.filteredMaterials.length : 0;
  }

  getTotalStudentsCount(): number {
    return this.materials.reduce((total, material) => total + material.kelas_info.total_siswa, 0);
  }

  getAverageProgress(): number {
    if (this.materials.length === 0) return 0;
    const total = this.materials.reduce((sum, material) => sum + material.persentase_selesai, 0);
    return Math.round(total / this.materials.length);
  }

  getTotalStudentsCompleted(): number {
    return this.materials.reduce((total, material) => total + material.siswa_selesai, 0);
  }

  hasFiltersApplied(): boolean {
    const hasKeyword = this.keyword && this.keyword.trim().length > 0;
    return Boolean(hasKeyword) || 
           this.selectedKelas !== 'all' || 
           this.selectedTahunAjaran !== 'all' || 
           this.selectedKategori !== 'all';
  }

  // ✅ TAMBAH: Get progress color dan helper methods
  getProgressColor(percentage: number): string {
    return this.teacherProgressService.getProgressColor(percentage);
  }

  getProgressText(percentage: number): string {
    return this.teacherProgressService.getProgressText(percentage);
  }

  getKategoriIcon(kategori: string): string {
    return this.teacherProgressService.getKategoriMateriIcon(kategori);
  }

  formatDate(date: Date | string): string {
    return this.teacherProgressService.formatDateShort(date);
  }
}
