import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TeacherProgressService, ClassSummary, ClassesSummaryResponse } from 'src/app/service/teacher-progress.service';

@Component({
  selector: 'app-manage-learning-outcomes',
  templateUrl: './manage-learning-outcomes.component.html',
  styleUrls: ['./manage-learning-outcomes.component.css']
})
export class ManageLearningOutcomesComponent implements OnInit, OnDestroy {

  // ✅ UPDATED: Properties untuk data dinamis
  kelas: ClassSummary[] = [];
  filteredKelas: ClassSummary[] = [];
  keyword: string = '';
  loading: boolean = false;
  errorMsg: string = '';

  // School and teacher info
  sekolahInfo: any = null;
  guruInfo: any = null;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private teacherProgressService: TeacherProgressService
  ) { }

  ngOnInit(): void {
    this.loadClassesSummary();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ TAMBAH: Load data dari backend
  loadClassesSummary(): void {
    this.loading = true;
    this.errorMsg = '';

    this.teacherProgressService.getClassesSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ClassesSummaryResponse) => {
          console.log('✅ Classes summary response:', response);

          if (response.success) {
            this.kelas = response.data || [];
            this.filteredKelas = [...this.kelas];
            this.sekolahInfo = response.sekolah_info;
            this.guruInfo = response.guru_info;

            // Show message if no classes found
            if (this.kelas.length === 0) {
              this.errorMsg = response.message || 'Belum ada kelas dengan materi yang terkait.';
            }
          } else {
            this.errorMsg = response.message || 'Gagal memuat data kelas.';
            this.kelas = [];
            this.filteredKelas = [];
          }

          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error loading classes summary:', error);

          let errorMessage = 'Gagal memuat data hasil belajar. ';

          if (error.status === 401) {
            errorMessage += 'Sesi login telah berakhir. Silakan login ulang.';
          } else if (error.status === 403) {
            errorMessage += 'Anda tidak memiliki akses untuk melihat data ini.';
          } else if (error.status === 0) {
            errorMessage += 'Tidak dapat terhubung ke server.';
          } else {
            errorMessage += 'Silakan coba lagi.';
          }

          this.errorMsg = errorMessage;
          this.kelas = [];
          this.filteredKelas = [];
          this.loading = false;
        }
      });
  }

  // ✅ UPDATED: Search function
  onSearch(): void {
    if (!this.keyword.trim()) {
      this.filteredKelas = [...this.kelas];
      return;
    }

    const searchTerm = this.keyword.toLowerCase().trim();
    this.filteredKelas = this.kelas.filter(kelas =>
      kelas.nama_kelas.toLowerCase().includes(searchTerm) ||
      kelas.tahun_ajaran.toLowerCase().includes(searchTerm) ||
      kelas.nama_sekolah.toLowerCase().includes(searchTerm)
    );
  }


  lihatKelas(kelas: ClassSummary): void {
    this.router.navigate(['/guru/hasil-belajar/detail-materi-belajar', kelas._id]);
  }

  // ✅ TAMBAH: Refresh data
  refreshData(): void {
    this.loadClassesSummary();
  }

  // ✅ TAMBAH: Helper methods untuk stats
  getTotalClassesCount(): number {
    return this.kelas.length;
  }

  getFilteredClassesCount(): number {
    return this.filteredKelas.length;
  }

  getTotalStudentsCount(): number {
    return this.kelas.reduce((total, kelas) => total + kelas.jumlah_siswa, 0);
  }

  getTotalMaterialsCount(): number {
    return this.kelas.reduce((total, kelas) => total + kelas.materi_tertaut, 0);
  }

  // ✅ TAMBAH: Get average students per class
  getAverageStudentsPerClass(): number {
    if (this.kelas.length === 0) return 0;
    return Math.round(this.getTotalStudentsCount() / this.kelas.length);
  }

  // ✅ TAMBAH: Get average materials per class
  getAverageMaterialsPerClass(): number {
    if (this.kelas.length === 0) return 0;
    return Math.round(this.getTotalMaterialsCount() / this.kelas.length);
  }

  // ✅ TAMBAH: Get progress color based on material count
  getProgressColor(materiTertaut: number): string {
    if (materiTertaut >= 10) return '#28a745'; // Green - Banyak materi
    if (materiTertaut >= 5) return '#17a2b8';  // Blue - Cukup materi
    if (materiTertaut >= 3) return '#ffc107';  // Yellow - Sedang
    if (materiTertaut >= 1) return '#fd7e14';  // Orange - Sedikit
    return '#dc3545'; // Red - Tidak ada materi
  }

  // ✅ TAMBAH: Get progress text
  getProgressText(materiTertaut: number): string {
    if (materiTertaut >= 10) return 'Sangat Baik';
    if (materiTertaut >= 5) return 'Baik';
    if (materiTertaut >= 3) return 'Cukup';
    if (materiTertaut >= 1) return 'Perlu Ditingkatkan';
    return 'Belum Ada Materi';
  }

  // ✅ TAMBAH: Sort functionality
  sortBy: 'name' | 'students' | 'materials' = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  sortClasses(criteria: 'name' | 'students' | 'materials'): void {
    if (this.sortBy === criteria) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = criteria;
      this.sortDirection = 'asc';
    }

    this.filteredKelas.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (criteria) {
        case 'name':
          valueA = a.nama_kelas.toLowerCase();
          valueB = b.nama_kelas.toLowerCase();
          break;
        case 'students':
          valueA = a.jumlah_siswa;
          valueB = b.jumlah_siswa;
          break;
        case 'materials':
          valueA = a.materi_tertaut;
          valueB = b.materi_tertaut;
          break;
        default:
          return 0;
      }

      if (this.sortDirection === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });
  }

  // ✅ TAMBAH: Get sort icon
  getSortIcon(criteria: 'name' | 'students' | 'materials'): string {
    if (this.sortBy !== criteria) return 'fas fa-sort';
    return this.sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }
}
