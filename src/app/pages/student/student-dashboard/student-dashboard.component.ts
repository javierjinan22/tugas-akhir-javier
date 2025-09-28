import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StudentProgressService, MaterialsResponse, MaterialSummary } from '../../../service/student-progress.service';
import { LearningHistoryService, RankingsResponse, StudentRanking, FeedbackResponse, FeedbackItem } from '../../../service/learning-history.service'; // ✅ UPDATE: Import FeedbackItem dari service
import { AuthService } from '../../../service/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit {
  
  // Data properties
  studentName: string = '';
  loading: boolean = true;
  error: string = '';
  
  // Summary data
  completedCount: number = 0;
  uncompletedCount: number = 0;
  totalMaterials: number = 0;
  
  // Top 3 rankings data
  topRankings: StudentRanking[] = [];
  currentStudentRank: number = 0;
  rankingsLoading: boolean = false;
  hasValidRankings: boolean = false;
  totalStudentsInClass: number = 0;
  
  // ✅ UPDATE: Gunakan FeedbackItem dari service
  feedbacks: FeedbackItem[] = [];
  feedbacksLoading: boolean = false;
  
  // API base URL for images
  private apiBaseUrl = environment.apiUrl;

  constructor(
    private router: Router,
    private studentProgressService: StudentProgressService,
    private learningHistoryService: LearningHistoryService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadStudentData();
    this.loadDashboardData();
    this.loadTopRankings();
    this.loadTeacherFeedbacks(); // ✅ Load feedbacks
  }

  loadStudentData(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.studentName = user.nama_lengkap ? user.nama_lengkap.split(' ')[0] : 'Siswa';
      } catch (error) {
        this.studentName = 'Siswa';
      }
    } else {
      this.studentName = 'Siswa';
    }

    this.authService.getProfile().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const fullName = response.data.nama_lengkap || response.data.nama || response.data.username;
          if (fullName) {
            this.studentName = fullName.split(' ')[0];
            localStorage.setItem('user', JSON.stringify(response.data));
          }
        }
      },
      error: (error) => {
        console.error('Error loading profile:', error);
      }
    });
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = '';

    this.studentProgressService.getMateriWithProgress().subscribe({
      next: (response: MaterialsResponse) => {
        if (response.success) {
          this.completedCount = response.data.summary.completed;
          this.uncompletedCount = response.data.summary.not_started + response.data.summary.in_progress;
          this.totalMaterials = response.data.summary.total_materi;
        } else {
          this.error = 'Gagal memuat data dashboard';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.error = 'Gagal memuat data dashboard. Periksa koneksi internet Anda.';
        this.loading = false;
      }
    });
  }

  // loadTopRankings(): void {
  //   this.rankingsLoading = true;
    
  //   this.learningHistoryService.getStudentRankings('all').subscribe({
  //     next: (response: RankingsResponse) => {
  //       if (response.success) {
  //         this.topRankings = response.data.rankings.slice(0, 3);
  //         this.currentStudentRank = response.data.current_student?.rank || 0;
  //       } else {
  //         console.warn('Failed to load rankings');
  //       }
  //       this.rankingsLoading = false;
  //     },
  //     error: (error) => {
  //       console.error('Error loading top rankings:', error);
  //       this.rankingsLoading = false;
  //     }
  //   });
  // }

  loadTopRankings(): void {
    this.rankingsLoading = true;
    this.hasValidRankings = false; // ✅ Reset flag
    
    this.learningHistoryService.getStudentRankings('all').subscribe({
      next: (response: RankingsResponse) => {
        console.log('Rankings response:', response); // ✅ Debug log
        
        if (response.success) {
          this.topRankings = response.data.rankings.slice(0, 3);
          this.currentStudentRank = response.data.current_student?.rank || 0;
          this.totalStudentsInClass = response.data.total_students || 0;
          
          // ✅ PERBAIKI: Cek apakah ada siswa yang sudah mengerjakan kuis dengan score > 0
          this.hasValidRankings = this.topRankings.length > 0 && 
                                 this.topRankings.some(ranking => 
                                   ranking.score > 0 || ranking.total_attempts > 0
                                 );
          
          console.log('Rankings processed:', {
            totalRankings: this.topRankings.length,
            totalStudentsInClass: this.totalStudentsInClass,
            hasScores: this.topRankings.some(ranking => ranking.score > 0),
            hasTotalAttempts: this.topRankings.some(ranking => ranking.total_attempts > 0),
            hasValidRankings: this.hasValidRankings,
            currentStudentRank: this.currentStudentRank,
            currentStudentScore: response.data.current_student?.score,
            currentStudentAttempts: response.data.current_student?.total_attempts
          });
        } else {
          console.warn('Failed to load rankings');
          this.hasValidRankings = false;
        }
        this.rankingsLoading = false;
      },
      error: (error) => {
        console.error('Error loading top rankings:', error);
        this.rankingsLoading = false;
        this.hasValidRankings = false;
      }
    });
  }

  hasValidRankingsData(): boolean {
    return this.hasValidRankings;
  }

  // ✅ PERBAIKI: Method untuk cek apakah current student sudah mengerjakan kuis
  hasCompletedQuiz(): boolean {
    const currentStudent = this.topRankings.find(r => r.rank === this.currentStudentRank);
    return currentStudent ? 
           (currentStudent.score > 0 || currentStudent.total_attempts > 0) : 
           false;
  }

  // ✅ TAMBAH: Method untuk cek apakah ada siswa di kelas yang sudah mengerjakan kuis
  hasClassCompletedAnyQuiz(): boolean {
    return this.topRankings.some(ranking => 
      ranking.score > 0 || ranking.total_attempts > 0
    );
  }

  getStudentsWithQuizCount(): number {
    return this.topRankings.filter(ranking => 
      ranking.score > 0 || ranking.total_attempts > 0
    ).length;
  }

  // ✅ FIX: Load teacher feedbacks menggunakan getStudentFeedback()
  loadTeacherFeedbacks(): void {
    this.feedbacksLoading = true;
    
    this.learningHistoryService.getStudentFeedback().subscribe({
      next: (response: FeedbackResponse) => {
        console.log('Feedback response:', response);
        
        if (response.success) {
          // Ambil 2 feedback terbaru untuk dashboard
          this.feedbacks = response.data.feedbacks.slice(0, 2);
        } else {
          console.warn('Failed to load feedbacks');
          this.feedbacks = [];
        }
        this.feedbacksLoading = false;
      },
      error: (error) => {
        console.error('Error loading feedbacks:', error);
        this.feedbacks = [];
        this.feedbacksLoading = false;
      }
    });
  }

  // Navigation methods
  onMulaiBelajar(): void {
    this.router.navigate(['/siswa/materi']);
  }

  onViewUncompletedMaterials(): void {
    this.router.navigate(['/siswa/materi'], { 
      fragment: 'learning'
    });
  }

  onViewCompletedMaterials(): void {
    this.router.navigate(['/siswa/materi'], { 
      fragment: 'completed'
    });
  }

  onViewAllRankings(): void {
    this.router.navigate(['/siswa/riwayat']);
  }

  // ✅ UPDATE: View material dari feedback menggunakan method yang sama dengan learning-history
  viewMaterial(feedback: FeedbackItem): void {
    // Gunakan method yang sama dengan learning-history component
    const materialId = this.getMaterialIdFromFeedback(feedback);
    
    console.log('Navigating to material:', {
      feedbackId: feedback._id,
      materialId: materialId,
      feedback: feedback
    });
    
    // Navigasi ke halaman detail materi
    this.router.navigate(['/siswa/materi/lihat-materi', materialId]).then(success => {
      if (success) {
        console.log('Navigation successful');
      } else {
        console.error('Navigation failed');
      }
    });
  }

  // ✅ TAMBAH: Method untuk mendapatkan material ID yang benar dari feedback (sama dengan learning-history)
  getMaterialIdFromFeedback(feedback: FeedbackItem): string {
    // Gunakan materi_id dari feedback response
    if (feedback.materi_id) {
      return feedback.materi_id;
    }
    
    // Fallback jika struktur berbeda
    console.warn('materi_id tidak ditemukan dalam feedback:', feedback);
    return feedback._id; // fallback ke feedback ID
  }

  // Helper methods untuk rankings
  getRankBadge(rank: number): string {
    switch (rank) {
      case 1:
        return 'assets/img/badge-1.png';
      case 2:
        return 'assets/img/badge-2.png';
      case 3:
        return 'assets/img/badge-3.png';
      default:
        return '';
    }
  }

  getRankBadgeClass(rank: number): string {
    switch (rank) {
      case 1:
        return 'rank-1';
      case 2:
        return 'rank-2';
      case 3:
        return 'rank-3';
      default:
        return '';
    }
  }

  // ✅ UPDATE: Helper methods untuk feedback (sama dengan learning-history)
  getCategoryColor(kategori: string): string {
    switch (kategori) {
      case 'Cakap Digital':
        return '#e57373';
      case 'Aman Digital':
        return '#ffd700';
      case 'Budaya Digital':
        return '#81c784';
      case 'Etika Digital':
        return '#90a4ae';
      default:
        return '#ccc';
    }
  }

  formatDate(date: string): string {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  // ✅ TAMBAH: Check if student has completed any quiz
  // hasCompletedQuiz(): boolean {
  //   return this.currentStudentRank > 0;
  // }

  // Helper methods (existing)
  getImageUrl(headerImage?: string): string {
    if (!headerImage) {
      return 'assets/img/placeholder.png';
    }
    
    if (headerImage.startsWith('http')) {
      return headerImage;
    }
    
    return `${this.apiBaseUrl}/uploads/${headerImage}`;
  }

  trackByStudentId(index: number, student: StudentRanking): string {
    return student.student_id;
  }

  trackByFeedbackId(index: number, feedback: FeedbackItem): string {
    return feedback._id;
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'assets/img/placeholder.png';
    }
  }

  // Retry method
  retryLoadData(): void {
    this.loadDashboardData();
    this.loadTopRankings();
    this.loadTeacherFeedbacks();
  }
}
