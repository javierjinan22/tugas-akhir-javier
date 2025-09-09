import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BsModalService } from 'ngx-bootstrap/modal';
import { TeacherProgressService, StudentProgress, MaterialStudentsProgressResponse } from 'src/app/service/teacher-progress.service';
import { ModalAddFeedbackComponent } from '../modal-add-feedback/modal-add-feedback.component';

@Component({
  selector: 'app-detail-students-learning-outcomes',
  templateUrl: './detail-students-learning-outcomes.component.html',
  styleUrls: ['./detail-students-learning-outcomes.component.css']
})
export class DetailStudentsLearningOutcomesComponent implements OnInit, OnDestroy {

  // ✅ UPDATED: Properties untuk data dinamis dengan classId dan materiId
  classId: string = '';
  materiId: string = '';
  materiInfo: any = null;
  students: StudentProgress[] = [];
  filteredStudents: StudentProgress[] = [];
  statistics: any = null;
  keyword: string = '';
  loading: boolean = false;
  errorMsg: string = '';

  // Filter options
  selectedStatus: string = 'all';
  statusOptions: { value: string; label: string }[] = [
    { value: 'all', label: 'Semua Status' },
    { value: 'completed', label: 'Selesai' },
    { value: 'in_progress', label: 'Sedang Belajar' },
    { value: 'not_started', label: 'Belum Mulai' }
  ];

  // Sort
  sortBy: 'name' | 'status' | 'progress' | 'score' = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private modalService: BsModalService,
    private teacherProgressService: TeacherProgressService
  ) { }

  ngOnInit(): void {
    // ✅ UPDATED: Get classId dan materiId from route params
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.classId = params['classId'];
      this.materiId = params['materiId'];
      
      console.log('Route params:', { classId: this.classId, materiId: this.materiId });
      
      if (this.classId && this.materiId) {
        this.loadMaterialStudentsProgress();
      } else {
        this.errorMsg = 'Parameter kelas atau materi tidak valid.';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ UPDATED: Load data siswa dari backend dengan classId dan materiId
  loadMaterialStudentsProgress(): void {
    this.loading = true;
    this.errorMsg = '';

    console.log('Loading material students progress for:', { classId: this.classId, materiId: this.materiId });

    this.teacherProgressService.getMaterialStudentsProgress(this.classId, this.materiId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: MaterialStudentsProgressResponse) => {
          console.log('✅ Material students progress response:', response);
          
          if (response.success) {
            this.materiInfo = response.data.materi_info;
            this.students = response.data.students || [];
            this.statistics = response.data.statistics;
            this.filteredStudents = [...this.students];
            
            // Show message if no students found
            if (this.students.length === 0) {
              this.errorMsg = 'Belum ada siswa yang terdaftar untuk materi ini di kelas yang dipilih.';
            }
          } else {
            this.errorMsg = response.message || 'Gagal memuat data siswa.';
            this.students = [];
            this.filteredStudents = [];
          }
          
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error loading material students:', error);
          
          let errorMessage = 'Gagal memuat data siswa. ';
          
          if (error.status === 401) {
            errorMessage += 'Sesi login telah berakhir. Silakan login ulang.';
          } else if (error.status === 403) {
            errorMessage += 'Anda tidak memiliki akses untuk melihat data ini.';
          } else if (error.status === 404) {
            errorMessage += 'Kelas atau materi tidak ditemukan.';
          } else if (error.status === 0) {
            errorMessage += 'Tidak dapat terhubung ke server.';
          } else {
            errorMessage += 'Silakan coba lagi.';
          }
          
          this.errorMsg = errorMessage;
          this.students = [];
          this.filteredStudents = [];
          this.loading = false;
        }
      });
  }

  // ✅ UPDATED: Send feedback dengan data real menggunakan materiId yang benar
  sendFeedback(student: StudentProgress): void {
    const initialState = { 
      student,
      materiInfo: this.materiInfo,
      materiId: this.materiId, // ✅ TAMBAH: Pass materiId
      classId: this.classId,   // ✅ TAMBAH: Pass classId
      onFeedbackSent: () => {
        // Optional: refresh data atau show success message
        console.log('Feedback sent successfully');
        this.refreshData();
      }
    };
    this.modalService.show(ModalAddFeedbackComponent, { 
      class: 'modal-dialog-centered', 
      initialState 
    });
  }

  lihatDetailQuiz(student: StudentProgress): void {
    this.router.navigate([
      '/guru/hasil-belajar/detail-materi-belajar',
      this.classId,
      'materials',
      this.materiId,
      'students',
      student._id,
      'quiz-result'
    ]);
  }

  // ✅ UPDATED: Back to detail learning outcomes dengan classId
  backToDetailLearningOutcomes(): void {
    this.router.navigate(['/guru/hasil-belajar/detail-materi-belajar', this.classId]);
  }

  // ✅ UPDATED: Navigate to answer review dengan parameter yang benar
  koreksiJawaban(student: StudentProgress): void {
    this.router.navigate([
      '/guru/hasil-belajar/detail-materi-belajar',
      this.classId,
      'materials',
      this.materiId,
      'students',
      student._id,
      'koreksi-jawaban'
    ]);
  }

  // ✅ UPDATED: Search function
  onSearch(): void {
    this.applyFilters();
  }

  // ✅ TAMBAH: Apply filters dan search
  applyFilters(): void {
    let filtered = [...this.students];

    // Filter by status
    if (this.selectedStatus !== 'all') {
      filtered = this.teacherProgressService.filterStudentsByStatus(filtered, this.selectedStatus);
    }

    // Filter by search keyword
    if (this.keyword.trim()) {
      filtered = this.teacherProgressService.searchStudents(filtered, this.keyword);
    }

    this.filteredStudents = filtered;
  }

  // ✅ TAMBAH: Status change
  onStatusChange(): void {
    this.applyFilters();
  }

  // ✅ TAMBAH: Reset filters
  resetFilters(): void {
    this.keyword = '';
    this.selectedStatus = 'all';
    this.onSearch();
  }

  // ✅ TAMBAH: Sort functionality
  sortStudents(criteria: 'name' | 'status' | 'progress' | 'score'): void {
    if (this.sortBy === criteria) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = criteria;
      this.sortDirection = 'asc';
    }

    this.filteredStudents = this.teacherProgressService.sortStudents(this.filteredStudents, criteria);
    
    if (this.sortDirection === 'desc') {
      this.filteredStudents.reverse();
    }
  }

  // ✅ TAMBAH: Get sort icon
  getSortIcon(criteria: 'name' | 'status' | 'progress' | 'score'): string {
    if (this.sortBy !== criteria) return 'fas fa-sort';
    return this.sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }

  // ✅ TAMBAH: Refresh data
  refreshData(): void {
    this.loadMaterialStudentsProgress();
  }

  // ✅ TAMBAH: Helper methods
  getTotalStudentsCount(): number {
    return this.students.length;
  }

  getFilteredStudentsCount(): number {
    return this.filteredStudents.length;
  }

  hasFiltersApplied(): boolean {
    return this.keyword.trim() !== '' || this.selectedStatus !== 'all';
  }

  // ✅ TAMBAH: Get student status badge
  getStudentStatusBadge(status: string): { class: string; text: string } {
    return this.teacherProgressService.getStudentStatusBadge(status);
  }

  // ✅ TAMBAH: Get progress percentage
  getProgressPercentage(student: StudentProgress): number {
    return this.teacherProgressService.getBabCompletionPercentage(student.completed_babs, student.total_babs);
  }

  // ✅ TAMBAH: Get progress color
  getProgressColor(percentage: number): string {
    return this.teacherProgressService.getProgressColor(percentage);
  }

  // ✅ TAMBAH: Format nilai
  formatNilai(nilai: number | null): string {
    return this.teacherProgressService.formatNilai(nilai);
  }

  // ✅ TAMBAH: Format date
  formatDate(date: Date | string | null): string {
    return this.teacherProgressService.formatDate(date);
  }

  // ✅ TAMBAH: Get completion status text
  getCompletionText(student: StudentProgress): string {
    if (student.status === 'completed') {
      return `Selesai (${student.completed_babs}/${student.total_babs} bab)`;
    } else if (student.status === 'in_progress') {
      return `Sedang belajar (${student.completed_babs}/${student.total_babs} bab)`;
    } else {
      return 'Belum mulai';
    }
  }

  // ✅ TAMBAH: Check if student has quiz score
  hasQuizScore(student: StudentProgress): boolean {
    return student.nilai !== null && student.nilai !== undefined;
  }

  // ✅ TAMBAH: Get quiz info text
  getQuizInfoText(student: StudentProgress): string {
    if (!this.materiInfo?.has_quiz) {
      return 'Tidak ada kuis';
    }
    
    if (student.quiz_attempts === 0) {
      return 'Belum mengerjakan';
    }
    
    return `${student.quiz_attempts} percobaan`;
  }

  // ✅ TAMBAH: Get statistics percentage
  getStatPercentage(count: number): number {
    if (!this.statistics?.total_siswa || this.statistics.total_siswa === 0) return 0;
    return Math.round((count / this.statistics.total_siswa) * 100);
  }
}
