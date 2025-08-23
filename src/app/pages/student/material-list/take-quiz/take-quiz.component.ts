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
            totalQuestions: response.data.quiz.questions.length
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

  refreshQuizData(): void {
    this.loadMaterialData();
  }

  setQuizIntroContent(): void {
    const waktuText = this.material?.waktu_pengerjaan ? `${this.material.waktu_pengerjaan} menit` : '10 menit';
    const totalSoal = this.material?.totalQuestions || 0;
    const isQuizCompleted = this.material?.quizCompleted;

    // Content berbeda untuk quiz yang sudah selesai
    if (isQuizCompleted) {
      this.currentPageContent = this.sanitizer.bypassSecurityTrustHtml(`
      <h5>Riwayat Kuis</h5>
      <p>
        Anda telah menyelesaikan kuis untuk materi ini. Di bawah ini adalah riwayat pengerjaan kuis Anda.
        Anda dapat melihat detail jawaban dari setiap attempt yang pernah dilakukan.
      </p>
      <p class="quiz-completed-message">
        Jika ingin mengulang kuis untuk meningkatkan pemahaman, Anda dapat mengerjakan kembali dengan menekan tombol "Mulai" di bawah.
      </p>
    `);
    } else {
      // Content untuk quiz yang belum selesai (existing)
      this.currentPageContent = this.sanitizer.bypassSecurityTrustHtml(`
      <h5>Aturan</h5>
      <p>
        Ini adalah modul untuk menguji pengetahuan Anda tentang materi yang sudah Anda pelajari.
        Terdapat ${totalSoal} pertanyaan yang harus dikerjakan dalam ujian ini. Beberapa ketentuan dari ujian ini
        adalah:
      </p>
      <ul>
        <li>Syarat nilai kelulusan : 75%</li>
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
    return this.material?.quizCompleted ? 'Ulangi Kuis' : 'Mulai';
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

  goToAllMaterials(): void {
    this.router.navigate(['/siswa/materi']);
  }

  goBackToMaterial(): void {
    this.router.navigate(['/siswa/materi/lihat-materi', this.materialId]);
  }
}
