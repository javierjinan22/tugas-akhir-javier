import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TeacherProgressService, ClassSummary } from 'src/app/service/teacher-progress.service';
import { RankingService, SchoolRanking, StudentRanking } from 'src/app/service/ranking.service';

@Component({
  selector: 'app-ranking-view',
  templateUrl: './ranking-view.component.html',
  styleUrls: ['./ranking-view.component.css']
})
export class RankingViewComponent implements OnInit, OnDestroy {

  // Class Rankings Data
  classList: ClassSummary[] = [];
  selectedClassId: string = 'all';
  selectedKategori: string = 'all';
  classRankings: StudentRanking[] = [];
  classRankingStats: any = {};
  classRankingInfo: any = {};

  // School Rankings Data  
  schoolRankings: SchoolRanking[] = [];
  schoolRankingStats: any = {};

  // Filter options
  classOptions: Array<{ value: string; label: string }> = [];
  kategoriOptions: Array<{ value: string; label: string }> = [];
  kategoriList: string[] = []; // ✅ TAMBAH: untuk menyimpan kategori dari endpoint

  // School ranking filters
  selectedProvinsi: string = '';
  selectedLimit: number = 10;
  provinsiOptions: Array<{ value: string; label: string }> = [];
  limitOptions: Array<{ value: number; label: string }> = [
    { value: 5, label: '5 Teratas' },
    { value: 10, label: '10 Teratas' },
    { value: 25, label: '25 Teratas' },
    { value: 50, label: '50 Teratas' }
  ];
  
  // Loading states
  loading: boolean = false;
  classRankingLoading: boolean = false;
  schoolRankingLoading: boolean = false;
  errorMsg: string = '';
  classRankingError: string = '';
  schoolRankingError: string = '';

  // Tab management
  activeTab: 'student' | 'school' = 'student';

  private destroy$ = new Subject<void>();

  constructor(
    private teacherProgressService: TeacherProgressService,
    private rankingService: RankingService
  ) { }

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ BARU: Load data awal termasuk kategori
  private loadInitialData(): void {
    this.loading = true;
    
    // Load kategori dari getAllMaterialsProgress seperti di manage-learning-outcomes
    this.teacherProgressService.getAllMaterialsProgress()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Set kategori list dari response
            this.kategoriList = response.data.kategori_list || [];
            this.buildKategoriOptions();
            
            console.log('✅ Kategori loaded:', this.kategoriList);
          }
          
          // Lanjutkan load data lainnya
          this.loadClassList();
        },
        error: (error) => {
          console.error('❌ Error loading initial data:', error);
          this.errorMsg = 'Gagal memuat data awal: ' + (error.message || error.error?.message || JSON.stringify(error));
          this.loading = false;
          
          // Tetap coba load class list meski kategori gagal
          this.loadClassList();
        }
      });
  }

  // ✅ BARU: Build kategori options dari endpoint
  private buildKategoriOptions(): void {
    this.kategoriOptions = [
      { value: 'all', label: 'Semua Kategori' }
    ];
    
    this.kategoriList.forEach(kategori => {
      this.kategoriOptions.push({ value: kategori, label: kategori });
    });

    console.log('✅ Kategori options built:', this.kategoriOptions);
  }

  private loadClassList(): void {
    this.teacherProgressService.getClassesSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.classList = response.data;
            this.buildClassOptions();
            
            console.log('✅ Classes loaded:', this.classList.length);
            
            // Load ranking untuk kelas pertama atau semua kelas
            if (this.classList.length > 0) {
              this.loadClassRankings();
            }
          }
          
          // Load provinsi dan school rankings
          this.loadProvinsiOptions();
          this.loadSchoolRankings();
          
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading class list:', error);
          this.errorMsg = 'Gagal memuat daftar peringkat';
          this.loading = false;
          
          // Tetap coba load provinsi dan school rankings
          this.loadProvinsiOptions();
          this.loadSchoolRankings();
        }
      });
  }

  private buildClassOptions(): void {
    this.classOptions = [
      { value: 'all', label: 'Semua Kelas' },
      ...this.classList.map(cls => ({
        value: cls._id,
        label: `${cls.nama_kelas} (${cls.tahun_ajaran})`
      }))
    ];
  }

  private loadProvinsiOptions(): void {
    this.rankingService.getProvinsi()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data.provinsi) {
            this.provinsiOptions = [
              { value: '', label: 'Semua Provinsi' },
              ...response.data.provinsi.map(prov => ({
                value: prov,
                label: prov
              }))
            ];
            
            console.log('✅ Provinsi loaded:', response.data.provinsi.length);
          }
        },
        error: (error) => {
          console.error('❌ Error loading provinsi options:', error);
          // ✅ HAPUS: fallback dummy data, tampilkan error
          console.log('❌ Provinsi error details:', error.message || error.error?.message || JSON.stringify(error));
        }
      });
  }

  private loadClassRankings(): void {
    this.classRankingLoading = true;
    this.classRankingError = '';
    
    this.rankingService.getStudentRankings(this.selectedClassId, this.selectedKategori)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.classRankings = response.data.students || [];
            this.classRankingStats = response.data.statistics || {};
            this.classRankingInfo = {
              nama_kelas: this.selectedClassId === 'all'
                ? 'Semua Kelas'
                : (response.data.students?.[0]?.kelas_info?.nama_kelas || '-'),
              guru_info: response.data.guru_info,
              sekolah_info: response.data.sekolah_info,
              total_siswa: response.data.total_students
            };
            
          } else {
            this.classRankingError = response.message || 'Tidak ada data ranking siswa';
            this.classRankings = [];
            this.classRankingStats = {};
            this.classRankingInfo = {};
          }
          this.classRankingLoading = false;
        },
        error: (error) => {
          console.error('❌ Error loading class rankings:', error);
          this.classRankingLoading = false;
          
          // ✅ TAMPILKAN: error response apa adanya
          this.classRankingError = 'Error loading class rankings: ' + (error.message || error.error?.message || JSON.stringify(error));
          this.classRankings = [];
          this.classRankingStats = {};
          this.classRankingInfo = {};
        }
      });
  }

  private loadSchoolRankings(): void {
    this.schoolRankingLoading = true;
    this.schoolRankingError = '';
    
    const filter = this.selectedProvinsi ? 'provinsi' : undefined;
    const value = this.selectedProvinsi || undefined;
    
    this.rankingService.getSchoolRankings(filter, value, this.selectedLimit)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.schoolRankings = response.data.schools || [];
            this.schoolRankingStats = {
              total_schools: response.data.total_schools,
              showing: response.data.showing,
              filter_info: response.data.filter_info
            };
            
            console.log('✅ School rankings loaded:', this.schoolRankings.length);
          } else {
            this.schoolRankingError = response.message || 'Tidak ada data ranking sekolah';
            this.schoolRankings = [];
            this.schoolRankingStats = {};
          }
          this.schoolRankingLoading = false;
        },
        error: (error) => {
          console.error('❌ Error loading school rankings:', error);
          this.schoolRankingLoading = false;
          
          // ✅ TAMPILKAN: error response apa adanya
          this.schoolRankingError = 'Error loading school rankings: ' + (error.message || error.error?.message || JSON.stringify(error));
          this.schoolRankings = [];
          this.schoolRankingStats = {};
        }
      });
  }

  // ✅ HAPUS: dummy data methods

  // Event handlers
  onClassFilterChange(selectedValue: string): void {
    this.selectedClassId = selectedValue;
    this.loadClassRankings();
  }

  onKategoriFilterChange(selectedValue: string): void {
    this.selectedKategori = selectedValue;
    this.loadClassRankings();
  }

  onProvinsiFilterChange(selectedValue: string): void {
    this.selectedProvinsi = selectedValue;
    this.loadSchoolRankings();
  }

  onLimitChange(selectedValue: number): void {
    this.selectedLimit = selectedValue;
    this.loadSchoolRankings();
  }

  onTabChange(tab: 'student' | 'school'): void {
    this.activeTab = tab;
    if (tab === 'school' && this.schoolRankings.length === 0 && !this.schoolRankingError) {
      this.loadSchoolRankings();
    }
  }

  refreshData(): void {
    if (this.activeTab === 'student') {
      this.loadClassRankings();
    } else {
      this.loadSchoolRankings();
    }
  }

  // ✅ TAMBAH: Refresh all data including initial data
  refreshAllData(): void {
    this.errorMsg = '';
    this.classRankingError = '';
    this.schoolRankingError = '';
    this.loadInitialData();
  }

  // Helper methods
  getMedalIcon(medalLevel: string): string {
    switch (medalLevel) {
      case 'gold': return 'fas fa-medal text-warning';
      case 'silver': return 'fas fa-medal text-secondary';
      case 'bronze': return 'fas fa-medal text-warning';
      default: return 'fas fa-circle text-muted';
    }
  }

  getMedalColor(medalLevel: string): string {
    switch (medalLevel) {
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'bronze': return '#CD7F32';
      default: return '#6c757d';
    }
  }

  getRankBadgeClass(rank: number): string {
    if (rank === 1) return 'badge-rank-1';
    if (rank === 2) return 'badge-rank-2';
    if (rank === 3) return 'badge-rank-3';
    return 'badge-rank-other';
  }

  getProgressBarClass(percentage: number): string {
    if (percentage >= 80) return 'bg-success';
    if (percentage >= 60) return 'bg-info';
    if (percentage >= 40) return 'bg-warning';
    return 'bg-danger';
  }

  formatPercentage(value: number): string {
    return `${Math.round(value)}%`;
  }

  trackByStudentId(index: number, item: StudentRanking): string {
    return item.student_id;
  }

  trackBySchoolId(index: number, item: SchoolRanking): string {
    return item._id;
  }
}
