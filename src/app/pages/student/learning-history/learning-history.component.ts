import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LearningHistoryService, AchievementsResponse, RankingsResponse, FeedbackResponse, MedalData, StudentRanking, FeedbackItem, StudentInfo } from '../../../service/learning-history.service';

@Component({
  selector: 'app-learning-history',
  templateUrl: './learning-history.component.html',
  styleUrls: ['./learning-history.component.css']
})
export class LearningHistoryComponent implements OnInit {
  loading = true;
  error = '';

  // Data properties
  studentInfo: StudentInfo | null = null;
  medals: { [key: string]: MedalData } = {};
  rankings: StudentRanking[] = [];
  feedbacks: FeedbackItem[] = [];
  currentStudent: any = null;

  // Filter properties
  selectedCategory = 'all';
  categories = [
    { value: 'all', label: 'Semua Kategori' },
    { value: 'Cakap Digital', label: 'Cakap Digital' },
    { value: 'Aman Digital', label: 'Aman Digital' },
    { value: 'Budaya Digital', label: 'Budaya Digital' },
    { value: 'Etika Digital', label: 'Etika Digital' }
  ];

  // Available categories for medals
  medalCategories = ['Cakap Digital', 'Aman Digital', 'Budaya Digital', 'Etika Digital'];

  constructor(
    private learningHistoryService: LearningHistoryService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loading = true;
    this.error = '';

    // Load achievements first
    this.learningHistoryService.getStudentAchievements().subscribe({
      next: (response: AchievementsResponse) => {
        this.studentInfo = response.data.student_info;
        this.medals = response.data.medals;
        
        // Load rankings after achievements
        this.loadRankings();
        // Load feedback
        this.loadFeedback();
      },
      error: (error) => {
        console.error('Error loading achievements:', error);
        this.error = 'Gagal memuat data pencapaian. Silakan coba lagi.';
        this.loading = false;
      }
    });
  }

  loadRankings(): void {
    this.learningHistoryService.getStudentRankings(this.selectedCategory).subscribe({
      next: (response: RankingsResponse) => {
        this.rankings = response.data.rankings;
        this.currentStudent = response.data.current_student;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading rankings:', error);
        this.error = 'Gagal memuat data peringkat. Silakan coba lagi.';
        this.loading = false;
      }
    });
  }

  loadFeedback(): void {
    this.learningHistoryService.getStudentFeedback().subscribe({
      next: (response: FeedbackResponse) => {
        this.feedbacks = response.data.feedbacks;
      },
      error: (error) => {
        console.error('Error loading feedback:', error);
      }
    });
  }

  onCategoryChange(): void {
    this.loadRankings();
  }

  // Helper methods
  getMedalIcon(medalLevel: string): string {
    switch (medalLevel) {
      case 'gold':
        return 'assets/img/gold-medal.png';
      case 'silver':
        return 'assets/img/silver-medal.png';
      case 'bronze':
        return 'assets/img/bronze-medal.png';
      default:
        return 'assets/img/no-medal.png';
    }
  }

  getRankBadge(rank: number): string {
    if (rank <= 3) {
      return `assets/img/badge-${rank}.png`;
    }
    return '';
  }

  getMedalByCategory(kategori: string): MedalData | null {
    return this.medals[kategori] || null;
  }

  getMedalDescription(kategori: string, medalData: MedalData): string {
    if (!medalData || medalData.medal_level === 'none') {
      return `Belum ada pencapaian di kategori ${kategori}`;
    }
    
    const levelText = medalData.medal_level === 'gold' ? 'emas' : 
                     medalData.medal_level === 'silver' ? 'perak' : 'perunggu';
    
    return `Kamu mendapatkan medali ${levelText} dengan skor rata-rata ${medalData.avg_score}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  getCategoryClass(kategori: string): string {
    switch (kategori) {
      case 'Cakap Digital':
        return 'cakap-digital';
      case 'Aman Digital':
        return 'aman-digital';
      case 'Budaya Digital':
        return 'budaya-digital';
      case 'Etika Digital':
        return 'etika-digital';
      default:
        return 'default-category';
    }
  }

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

  getMedalRankNumber(medalLevel: string): string {
    switch (medalLevel) {
      case 'gold':
        return '1';
      case 'silver':
        return '2';
      case 'bronze':
        return '3';
      default:
        return '-';
    }
  }

  // ✅ PERBAIKAN: Method untuk mendapatkan material ID yang benar dari feedback
  getMaterialIdFromFeedback(feedback: FeedbackItem): string {
    // Gunakan materi_id dari feedback response, bukan feedback._id
    if ((feedback as any).materi_id) {
      return (feedback as any).materi_id;
    }
    
    // Fallback jika struktur berbeda
    console.warn('materi_id tidak ditemukan dalam feedback:', feedback);
    return feedback._id; // fallback ke feedback ID
  }

  // Tambahkan method baru untuk header summary
  getTotalMedals(): number {
    return Object.values(this.medals).filter(medal => medal.medal_level !== 'none').length;
  }

  getCurrentRank(): number {
    return this.currentStudent?.rank || 0;
  }

  // ✅ PERBAIKAN: Method navigasi seperti viewMaterial di material-studied
  goToMaterial(feedback: FeedbackItem): void {
    const materialId = this.getMaterialIdFromFeedback(feedback);
    
    // Debug log untuk memastikan ID yang benar
    console.log('Navigating to material:', {
      feedbackId: feedback._id,
      materialId: materialId,
      feedback: feedback
    });
    
    // Navigasi sesuai dengan routing yang ada
    // Sesuaikan dengan pattern routing di app-routing.module.ts
    this.router.navigate(['/siswa/materi/detail', materialId]);
  }

  // ✅ ALTERNATIF: Jika ingin menggunakan fungsi yang sama persis dengan material-studied
  viewMaterial(feedback: FeedbackItem): void {
    const materialId = this.getMaterialIdFromFeedback(feedback);
    
    // Simpan ke localStorage jika diperlukan (seperti di material-studied)
    localStorage.setItem('currentMaterialId', materialId);
    
    // Navigasi ke halaman detail materi
    this.router.navigate(['/siswa/materi/lihat-materi', materialId]).then(success => {
      if (success) {
        console.log('Navigation successful');
      } else {
        console.error('Navigation failed');
        // Handle navigation error jika diperlukan
      }
    });
  }
}
