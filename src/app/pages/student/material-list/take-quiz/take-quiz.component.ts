import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BsModalService } from 'ngx-bootstrap/modal';
import { ModalStartQuizComponent } from '../modal-start-quiz/modal-start-quiz.component';
import { StudentProgressService } from '../../../../service/student-progress.service';

interface QuizAttempt {
  id: number;
  date: Date;
  score: number;
  isPassed: boolean;
  attemptData?: any;
}

interface Material {
  id: string;
  title: string;
  progress: number;
  isRead: boolean;
  quizCompleted: boolean;
  waktu_pengerjaan?: number;
  totalQuestions?: number;
  readPages?: number;
  totalPages?: number;
  hasQuiz?: boolean;
  pages: any[];
}

@Component({
  selector: 'app-take-quiz',
  templateUrl: './take-quiz.component.html',
  styleUrls: ['./take-quiz.component.css']
})
export class TakeQuizComponent implements OnInit {
  material: Material | null = null;
  currentPageContent!: SafeHtml;
  loading: boolean = false;
  error: string = '';
  materialId: string = ''; // ✅ Gunakan materialId langsung

  quizAttempts: QuizAttempt[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    private modalService: BsModalService,
    private studentProgressService: StudentProgressService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.materialId = params['id'];
      if (this.materialId) {
        this.loadMaterialData();
      }
    });
  }

  loadMaterialData(): void {
    this.loading = true;
    this.error = '';

    this.studentProgressService.getMateriDetailForViewing(this.materialId).subscribe({
      next: (response) => {
        if (response.success) {
          const materialData = response.data.material;

          this.material = {
            id: materialData.id,
            title: materialData.title,
            progress: materialData.progress,
            isRead: materialData.isRead,
            quizCompleted: materialData.quizCompleted,
            waktu_pengerjaan: materialData.waktu_pengerjaan,
            totalQuestions: response.data.quiz.questions.length,
            readPages: materialData.readPages || 0,
            totalPages: materialData.totalPages || 1,
            hasQuiz: materialData.hasQuiz ?? true,
            // ✅ PERBAIKAN: Pastikan pages selalu array, tidak undefined
            pages: Array.isArray(materialData.pages) ? materialData.pages : []
          };

          // Load quiz attempts dari API dengan safety check
          this.quizAttempts = [];
          if (response.data.quiz && response.data.quiz.attempts && Array.isArray(response.data.quiz.attempts)) {
            this.quizAttempts = response.data.quiz.attempts.map((attempt: any, index: number) => ({
              id: attempt.attempt_id || (index + 1),
              date: new Date(attempt.completed_at),
              score: attempt.score || 0,
              isPassed: (attempt.score || 0) >= 75,
              attemptData: attempt
            }));
          }

          this.updateMaterialProgress();
          this.setQuizIntroContent();
        } else {
          this.error = 'Gagal memuat data materi';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading material data:', error);
        this.error = 'Gagal memuat data materi';
        this.loading = false;
      }
    });
  }

  private updateMaterialProgress(): void {
    if (!this.material) return;

    const readPages = this.material.readPages || 0;
    const totalPages = this.material.totalPages || 1;
    const hasQuiz = this.material.hasQuiz ?? true;
    const hasPassedAttempt = this.quizAttempts.some(attempt => attempt.isPassed);

    if (hasQuiz) {
      // ✅ Progress 100% hanya jika ada attempt yang lulus
      if (hasPassedAttempt) {
        this.material.progress = 100;
        this.material.isRead = true;
        this.material.quizCompleted = true;
      } else if (readPages === totalPages) {
        // Semua bab selesai tapi belum lulus kuis
        this.material.progress = 90;
        this.material.isRead = true;
      } else {
        // Masih ada bab yang belum selesai
        this.material.progress = Math.round((readPages / totalPages) * 80);
        this.material.isRead = false;
      }
    } else {
      // Tidak ada kuis
      this.material.progress = Math.round((readPages / totalPages) * 100);
      this.material.isRead = readPages === totalPages;
    }
  }

  refreshQuizData(): void {
    this.loadMaterialData();
  }

  getProgressPercentage(): number {
    if (!this.material) return 0;

    const readPages = this.material.readPages || 0;
    const totalPages = this.material.totalPages || 1;
    const hasQuiz = this.material.hasQuiz ?? true;
    const hasPassedAttempt = this.quizAttempts.some(attempt => attempt.isPassed);

    if (hasQuiz) {
      // ✅ 100% hanya jika ada attempt yang lulus
      if (hasPassedAttempt) return 100;
      if (readPages === totalPages) return 90;
      return Math.round((readPages / totalPages) * 80);
    }
    return Math.round((readPages / totalPages) * 100);
  }

  // ✅ TAMBAH: Method untuk completion status
  getCompletionStatus(): string {
    if (!this.material) return '';

    const readPages = this.material.readPages || 0;
    const totalPages = this.material.totalPages || 1;
    const hasQuiz = this.material.hasQuiz ?? true;
    const hasPassedAttempt = this.quizAttempts.some(attempt => attempt.isPassed);

    if (hasQuiz) {
      if (hasPassedAttempt) return 'Selesai (dengan kuis)';
      if (readPages === totalPages) return 'Materi selesai, kuis belum lulus';
      return `${readPages}/${totalPages} bab`;
    }
    return readPages === totalPages ? 'Selesai' : `${readPages}/${totalPages} bab`;
  }

  // ✅ TAMBAH: Method untuk cek apakah kuis benar-benar selesai (lulus)
  isQuizCompleted(): boolean {
    return this.quizAttempts.some(attempt => attempt.isPassed);
  }

  setQuizIntroContent(): void {
    const waktuText = this.material?.waktu_pengerjaan ? `${this.material.waktu_pengerjaan} menit` : '10 menit';
    const totalSoal = this.material?.totalQuestions || 0;
    const hasPassedAttempt = this.quizAttempts.some(attempt => attempt.isPassed);
    const highestScore = this.quizAttempts.length > 0 ? Math.max(...this.quizAttempts.map(a => a.score)) : 0;

    // ✅ PERBAIKAN: Content berdasarkan status attempt yang lulus
    if (hasPassedAttempt) {
      this.currentPageContent = this.sanitizer.bypassSecurityTrustHtml(`
        <h5>Riwayat Kuis</h5>
        <p>
          Anda telah menyelesaikan kuis untuk materi ini. Di bawah ini adalah riwayat pengerjaan kuis Anda.
          Anda dapat melihat detail jawaban dari setiap kuis yang pernah dilakukan.
        </p>
        <div class="alert alert-success">
          <i class="fas fa-check-circle"></i>
          <strong>Selamat!</strong> Anda telah berhasil menyelesaikan kuis dengan nilai tertinggi ${highestScore} (syarat kelulusan 75).
        </div>
        <p class="quiz-completed-message">
          Jika ingin mengulang kuis untuk meningkatkan pemahaman, Anda dapat mengerjakan kembali dengan menekan tombol "Ulangi Kuis" di bawah.
        </p>
      `);
    } else if (this.quizAttempts.length > 0) {
      // ✅ Ada attempt tapi belum lulus
      this.currentPageContent = this.sanitizer.bypassSecurityTrustHtml(`
        <h5>Riwayat Kuis</h5>
        <p>
          Anda telah mengerjakan kuis untuk materi ini namun belum mencapai syarat kelulusan (75).
          Di bawah ini adalah riwayat pengerjaan kuis Anda.
        </p>
        <div class="alert alert-warning">
          <i class="fas fa-exclamation-triangle"></i>
          <strong>Belum Lulus!</strong> Nilai tertinggi Anda adalah ${highestScore}. Syarat kelulusan adalah 75.
        </div>
        <p class="quiz-retry-message">
          Silakan coba lagi untuk mencapai nilai kelulusan dengan menekan tombol "Coba Lagi" di bawah.
        </p>
      `);
    } else {
      // ✅ Belum pernah mengerjakan kuis
      this.currentPageContent = this.sanitizer.bypassSecurityTrustHtml(`
        <h5>Aturan</h5>
        <p>
          Ini adalah modul untuk menguji pengetahuan Anda tentang materi yang sudah Anda pelajari.
          Terdapat ${totalSoal} pertanyaan yang harus dikerjakan dalam ujian ini. Beberapa ketentuan dari ujian ini
          adalah:
        </p>
        <ul>
          <li>Syarat nilai kelulusan : 75</li>
          <li>Durasi ujian : ${waktuText}</li>
        </ul>
        <p>
          Apabila tidak memenuhi syarat kelulusan, maka Anda harus menunggu selama 1 menit untuk
          mengulang pengerjaan ujian kembali.
        </p>
        <p class="quiz-start-message">Selamat Mengerjakan!</p>
      `);
    }
  }

  getStartQuizButtonText(): string {
    const hasPassedAttempt = this.quizAttempts.some(attempt => attempt.isPassed);

    if (hasPassedAttempt) {
      return 'Ulangi Kuis';
    } else if (this.quizAttempts.length > 0) {
      return 'Coba Lagi';
    } else {
      return 'Mulai';
    }
  }

  startQuiz(): void {
    if (!this.material) return;

    // Clear previous quiz result ketika start quiz baru
    const previousResult = localStorage.getItem(`quiz_result_${this.materialId}`);
    if (previousResult) {
      console.log('🧹 Clearing previous quiz result for fresh start');
      localStorage.removeItem(`quiz_result_${this.materialId}`);
    }

    const initialState = {
      materialId: this.material.id,
      materialTitle: this.material.title,
      waktuPengerjaan: this.material.waktu_pengerjaan || 10,
      totalQuestions: this.material.totalQuestions || 0
    };

    const modalRef = this.modalService.show(ModalStartQuizComponent, {
      class: 'modal-dialog-centered',
      initialState
    });

    //  Listen ketika modal ditutup untuk refresh data
    modalRef.onHidden?.subscribe(() => {
      // Delay refresh untuk memastikan quiz sudah selesai submit
      setTimeout(() => {
        this.refreshQuizData();
      }, 1000);
    });
  }

  viewQuizDetail(attempt: QuizAttempt): void {
    console.log('Viewing quiz attempt details:', attempt);

    const attemptId = attempt.attemptData?._id || attempt.attemptData?.attempt_id || attempt.id;

    this.router.navigate(
      [`/siswa/materi/lihat-materi/${this.materialId}/kuis/hasil`],
      {
        queryParams: {
          attemptId: attemptId
        }
      }
    );
  }

  goToMaterialPage(pageIndex: number): void {
    // Navigate ke view-material dengan query param untuk halaman spesifik
    this.router.navigate(['/siswa/materi/lihat-materi', this.materialId], {
      queryParams: { page: pageIndex }
    });
  }

  goToAllMaterials(): void {
    this.router.navigate(['/siswa/materi']);
  }

  goBackToMaterial(): void {
    this.router.navigate(['/siswa/materi/lihat-materi', this.materialId]);
  }
}
