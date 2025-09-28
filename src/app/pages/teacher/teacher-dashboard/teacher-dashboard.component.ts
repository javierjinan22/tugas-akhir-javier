import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InputNpsnModalComponent } from 'src/app/features/input-npsn-modal/input-npsn-modal.component';
import { SchoolService } from 'src/app/service/school.service';
import { MaterialService } from 'src/app/service/material.service';
import { ClassService } from 'src/app/service/class.service';
import { TeacherProgressService, AllMaterialsProgressResponse } from 'src/app/service/teacher-progress.service';

@Component({
  selector: 'app-teacher-dashboard',
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.css']
})
export class TeacherDashboardComponent implements OnInit, OnDestroy {

  // User & School data
  school: any = null;
  isLoggedIn: boolean = false;
  isTeacher: boolean = false;
  token: string = '';
  schoolId: string = '';

  // Dashboard stats
  totalMaterials: number = 0;
  totalClasses: number = 0;
  activeMaterials: number = 0;
  completedMaterials: number = 0;

  // Monitoring pembelajaran data
  monitoringData: any[] = [];
  filteredMonitoringData: any[] = [];
  
  // Filter options
  kelasOptions: Array<{ value: string; label: string }> = [];
  statusOptions: Array<{ value: string; label: string }> = [
    { value: 'all', label: 'Semua Status' },
    { value: 'Berlangsung', label: 'Berlangsung' },
    { value: 'Selesai', label: 'Selesai' }
  ];
  
  // Selected filters
  selectedKelas: string = 'all';
  selectedStatus: string = 'all';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  paginatedData: any[] = [];
  
  // Loading states
  loading: boolean = false;
  statsLoading: boolean = false;
  monitoringLoading: boolean = false;
  errorMsg: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private schoolService: SchoolService,
    private materialService: MaterialService,
    private classService: ClassService,
    private teacherProgressService: TeacherProgressService,
    private modalService: BsModalService
  ) { 
    console.log('TeacherDashboardComponent constructed');
  }

  ngOnInit(): void {
    console.log('ngOnInit TeacherDashboardComponent');
    this.initializeUser();
    
    if (this.isLoggedIn && this.isTeacher) {
      this.loadSchoolData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeUser(): void {
    this.token = localStorage.getItem('token') || '';
    const role = localStorage.getItem('role');
    this.schoolId = localStorage.getItem('schoolId') || '';
    
    this.isLoggedIn = !!this.token;
    this.isTeacher = role === 'guru';
  }

  private loadSchoolData(): void {
    console.log('Ready to fetch my school...');
    this.loading = true;
    
    this.schoolService.getMySchool()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.school = data;
          
          if (this.school && this.school._id) {
            localStorage.setItem('schoolId', this.school._id);
            this.schoolId = this.school._id;
          }
          
          this.loading = false;
          
          // Load dashboard stats setelah school data berhasil
          this.loadDashboardStats();
          this.loadMonitoringData();
        },
        error: (err) => {
          this.loading = false;
          this.school = null;

          if (err.status === 404 && err.error?.message === 'Kamu belum mengelola sekolah manapun.') {
            console.log('User belum claim sekolah, buka modal claim sekolah.');
            this.modalService.show(InputNpsnModalComponent, {
              class: 'modal-dialog-centered modal-md'
            });
          } else {
            console.error('Error lain saat mengambil sekolah:', err);
            this.errorMsg = 'Gagal memuat data sekolah.';
          }
        }
      });
  }

  private loadDashboardStats(): void {
    this.statsLoading = true;
    
    // Load materials count
    this.materialService.getMyMaterials(this.token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const materials = response.data;
            this.totalMaterials = materials.length;
            this.activeMaterials = materials.filter((m: any) => m.is_active).length;
          }
          this.checkStatsLoadingComplete();
        },
        error: (error) => {
          console.error('Error loading materials:', error);
          this.checkStatsLoadingComplete();
        }
      });

    // Load classes count
    this.classService.getClassesBySchool(this.schoolId, this.token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.totalClasses = response.data.filter((cls: any) => !cls.archived_at).length;
          }
          this.checkStatsLoadingComplete();
        },
        error: (error) => {
          console.error('Error loading classes:', error);
          this.checkStatsLoadingComplete();
        }
      });

    // Load completed materials menggunakan teacher progress service
    this.teacherProgressService.getAllMaterialsProgress()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: AllMaterialsProgressResponse) => {
          if (response.success && response.data?.materials) {
            // Hitung materi yang 100% completed
            this.completedMaterials = response.data.materials.filter(
              material => material.persentase_selesai === 100
            ).length;
          }
          this.checkStatsLoadingComplete();
        },
        error: (error) => {
          console.error('Error loading completed materials:', error);
          this.checkStatsLoadingComplete();
        }
      });
  }

  private checkStatsLoadingComplete(): void {
    // Simple check - bisa diperbaiki dengan counter yang lebih robust
    setTimeout(() => {
      this.statsLoading = false;
    }, 500);
  }

  private loadMonitoringData(): void {
    this.monitoringLoading = true;
    
    this.teacherProgressService.getAllMaterialsProgress()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: AllMaterialsProgressResponse) => {
          if (response.success && response.data?.materials) {
            // Transform data untuk monitoring table
            this.monitoringData = response.data.materials.map((material, index) => ({
              no: index + 1,
              judul_materi: material.judul_materi,
              kelas: material.kelas_info.nama_kelas,
              kelas_id: material.kelas_info._id,
              siswa_mengerjakan: `${material.siswa_selesai} / ${material.total_siswa}`,
              status: material.persentase_selesai === 100 ? 'Selesai' : 'Berlangsung',
              persentase: material.persentase_selesai,
              material_id: material._id,
              class_id: material.kelas_info._id
            }));
            
            // Build filter options
            this.buildFilterOptions();
            
            // Apply filters and pagination
            this.applyFilters();
          }
          this.monitoringLoading = false;
        },
        error: (error) => {
          console.error('Error loading monitoring data:', error);
          this.monitoringLoading = false;
        }
      });
  }

  private buildFilterOptions(): void {
    // Build kelas options
    const uniqueKelas = [...new Set(this.monitoringData.map(item => item.kelas))];
    this.kelasOptions = [
      { value: 'all', label: 'Semua Kelas' },
      ...uniqueKelas.map(kelas => ({ value: kelas, label: kelas }))
    ];
  }

  // Filter methods
  onKelasFilterChange(selectedValue: string): void {
    this.selectedKelas = selectedValue;
    this.currentPage = 1; // Reset to first page
    this.applyFilters();
  }

  onStatusFilterChange(selectedValue: string): void {
    this.selectedStatus = selectedValue;
    this.currentPage = 1; // Reset to first page
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.monitoringData];

    // Filter by kelas
    if (this.selectedKelas !== 'all') {
      filtered = filtered.filter(item => item.kelas === this.selectedKelas);
    }

    // Filter by status
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(item => item.status === this.selectedStatus);
    }

    this.filteredMonitoringData = filtered;
    this.totalItems = filtered.length;
    
    // Apply pagination
    this.updatePagination();
  }

  // Pagination methods
  private updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedData = this.filteredMonitoringData.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get startItem(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endItem(): number {
    const end = this.currentPage * this.itemsPerPage;
    return end > this.totalItems ? this.totalItems : end;
  }

  getPageNumbers(): number[] {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  }

  // Navigation methods
  onTambahMateri(): void {
    this.router.navigate(['/guru/kelola-materi/tambah-materi']);
  }

  onTotalMateriClick(): void {
    this.router.navigate(['/guru/kelola-materi']);
  }

  onTotalKelasClick(): void {
    this.router.navigate(['/guru/kelola-kelas']);
  }

  onMateriAktifClick(): void {
    this.router.navigate(['/guru/kelola-materi']);
  }

  onMateriSelesaiClick(): void {
    // Navigate ke hasil belajar dengan filter completed materials
    this.router.navigate(['/guru/hasil-belajar'], {
      queryParams: { filter: 'completed' }
    });
  }

  onMonitoringRowClick(item: any): void {
    // Navigate ke detail students untuk materi ini
    this.router.navigate([
      '/guru/hasil-belajar/detail-materi-belajar', 
      item.class_id, 
      'materials', 
      item.material_id, 
      'students'
    ]);
  }

  // Helper methods
  getStatusBadgeClass(status: string): string {
    return status === 'Selesai' ? 'badge-selesai' : 'badge-berlangsung';
  }

  refreshData(): void {
    this.loadDashboardStats();
    this.loadMonitoringData();
  }

  // Format helpers
  getProgressPercentage(siswaSelesai: number, totalSiswa: number): number {
    if (totalSiswa === 0) return 0;
    return Math.round((siswaSelesai / totalSiswa) * 100);
  }

  trackByMaterialId(index: number, item: any): string {
    return item.material_id || index;
  }
}
