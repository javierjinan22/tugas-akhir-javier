import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { interval, Observable, Subscription } from 'rxjs';
import { ModalEndQuizComponent } from '../modal-end-quiz/modal-end-quiz.component';
import { StudentProgressService } from '../../../../service/student-progress.service';

interface QuizQuestion {
  id: number;
  type: 'pilihan_ganda' | 'isian_singkat' | 'benar_salah';
  question: string;
  options?: string[];
  correctAnswer?: string;
  userAnswer?: string | number;
}

interface Quiz {
  id: string;
  title: string;
  timeLimit: number;
  questions: QuizQuestion[];
}

@Component({
  selector: 'app-view-quiz',
  templateUrl: './view-quiz.component.html',
  styleUrls: ['./view-quiz.component.css']
})
export class ViewQuizComponent implements OnInit, OnDestroy {
  quiz: Quiz | null = null;
  currentQuestionIndex: number = 0;
  remainingTime: number = 0;
  timerSubscription?: Subscription;
  materialId: string = '';
  loading: boolean = false;
  error: string = '';

  get currentQuestion(): QuizQuestion | null {
    return this.quiz?.questions[this.currentQuestionIndex] || null;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private modalService: BsModalService,
    private studentProgressService: StudentProgressService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.materialId = params['id'];
      if (this.materialId) {
        this.loadQuizData();
      }
    });

    this.setupAutoSaveListeners();
  }

  private setupAutoSaveListeners(): void {
    // Save state saat tab tidak aktif
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.quiz) {
        this.forceSaveState();
      } else if (!document.hidden && this.quiz) {
        // Optional: reload state jika diperlukan
      }
    });

    // Save state sebelum page unload
    window.addEventListener('beforeunload', () => {
      if (this.quiz) {
        this.forceSaveState();
      }
    });

    // Save state saat focus hilang dari window
    window.addEventListener('blur', () => {
      if (this.quiz) {
        this.forceSaveState();
      }
    });
  }

  ngOnDestroy(): void {
    // ✅ PERBAIKAN: Force save sebelum destroy
    if (this.quiz) {
      this.forceSaveState();
    }

    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    // ✅ TAMBAH: Remove event listeners
    document.removeEventListener('visibilitychange', this.forceSaveState);
    window.removeEventListener('beforeunload', this.forceSaveState);
    window.removeEventListener('blur', this.forceSaveState);
  }

  loadQuizData(): void {
    this.loading = true;
    this.error = '';

    this.studentProgressService.getMateriDetailForViewing(this.materialId).subscribe({
      next: (response) => {
        if (response.success) {
          const materialData = response.data.material;
          const quizData = response.data.quiz;

          // ✅ Transform API data ke format komponen
          this.quiz = {
            id: materialData.id,
            title: materialData.title,
            timeLimit: (materialData.waktu_pengerjaan || 10) * 60, // konversi menit ke detik
            questions: quizData.questions.map((q: any, index: number) => ({
              id: index,
              type: q.type, // ✅ Langsung gunakan type dari API (pilihan_ganda, benar_salah, isian_singkat)
              question: q.question,
              options: q.options || [],
              correctAnswer: q.correct_answer,
              userAnswer: undefined
            }))
          };

          this.loadQuizState();
          this.startTimer();
        } else {
          this.error = 'Gagal memuat data kuis';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading quiz data:', error);
        this.error = 'Gagal memuat data kuis';
        this.loading = false;
      }
    });
  }

  loadQuizState(): void {
    if (!this.quiz) return;

    // ✅ Check if quiz was completed - if yes, start fresh
    const completedResult = localStorage.getItem(`quiz_result_${this.materialId}`);
    if (completedResult) {
      console.log('🔄 Quiz was completed before, starting fresh');
      this.clearQuizState();
      this.remainingTime = this.quiz.timeLimit;
      // ✅ TAMBAH: Save initial timer state untuk fresh start
      this.saveTimerState();
      return;
    }

    // Check localStorage for saved quiz state
    const savedState = localStorage.getItem(`quiz_${this.materialId}_state`);

    if (savedState) {
      const state = JSON.parse(savedState);
      this.currentQuestionIndex = state.currentQuestionIndex || 0;

      // Load saved answers
      if (state.answers) {
        state.answers.forEach((answer: any, index: number) => {
          if (index < this.quiz!.questions.length) {
            this.quiz!.questions[index].userAnswer = answer;
          }
        });
      }

      // ✅ PERBAIKAN: Timer persistence yang lebih akurat
      const savedTimer = localStorage.getItem(`quiz_${this.materialId}_timer`);
      if (savedTimer) {
        try {
          const timerData = JSON.parse(savedTimer);
          const now = Date.now();
          const elapsedTime = Math.floor((now - timerData.lastSavedTime) / 1000);
          const timeLeft = timerData.remainingTime - elapsedTime;

          console.log('🕐 Timer recovery:', {
            lastSavedTime: new Date(timerData.lastSavedTime),
            remainingTimeWhenSaved: timerData.remainingTime,
            elapsedSinceLastSave: elapsedTime,
            calculatedTimeLeft: timeLeft
          });

          if (timeLeft <= 0) {
            console.log('⏰ Timer expired during absence, auto-finishing quiz');
            this.remainingTime = 0;
            setTimeout(() => this.finishQuiz(), 100);
            return;
          } else {
            this.remainingTime = timeLeft;
            console.log(`✅ Timer resumed with ${timeLeft} seconds remaining`);
          }
        } catch (error) {
          console.error('Error parsing timer data:', error);
          this.remainingTime = this.quiz.timeLimit;
        }
      } else {
        this.remainingTime = this.quiz.timeLimit;
      }
    } else {
      this.remainingTime = this.quiz.timeLimit;
      this.saveQuizState();
    }
  }

  private clearTimerState(): void {
    localStorage.removeItem(`quiz_${this.materialId}_timer`);
  }

  isBenarSalahSelected(value: 'Benar' | 'Salah'): boolean {
    if (!this.currentQuestion || this.currentQuestion.type !== 'benar_salah') return false;
    return this.currentQuestion.userAnswer === value;
  }

  private saveTimerState(): void {
    const timerData = {
      remainingTime: this.remainingTime,
      lastSavedTime: Date.now(),
      totalTime: this.quiz?.timeLimit || 600
    };

    localStorage.setItem(`quiz_${this.materialId}_timer`, JSON.stringify(timerData));
  }

  saveQuizState(): void {
    if (!this.quiz) return;

    const answers = this.quiz.questions.map(q => q.userAnswer || null);

    const stateData = {
      currentQuestionIndex: this.currentQuestionIndex,
      answers,
      lastSaved: Date.now()
    };

    localStorage.setItem(`quiz_${this.materialId}_state`, JSON.stringify(stateData));

    this.saveTimerState();
  }

  startTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    //  Save initial timer state saat timer dimulai
    this.saveTimerState();
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.remainingTime > 0) {
        this.remainingTime--;
        this.saveTimerState();

        if (this.remainingTime % 10 === 0) {
          this.saveQuizState();
        }
      } else {
        this.finishQuiz();
      }
    });
  }

  private forceSaveState(): void {
    this.saveQuizState();
    this.saveTimerState();
    console.log('💾 Force saved quiz and timer state');
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')} m : ${remainingSeconds.toString().padStart(2, '0')} s`;
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.saveQuizState();
    }
  }

  nextQuestion(): void {
    if (this.quiz && this.currentQuestionIndex < this.quiz.questions.length - 1) {
      this.currentQuestionIndex++;
      this.saveQuizState();
    }
  }

  goToQuestion(index: number): void {
    if (this.quiz && index >= 0 && index < this.quiz.questions.length) {
      this.currentQuestionIndex = index;
      this.saveQuizState();
    }
  }

  selectBenarSalah(value: 'Benar' | 'Salah'): void {
    if (!this.currentQuestion || this.currentQuestion.type !== 'benar_salah') return;

    // Set jawaban langsung sebagai "Benar" atau "Salah"
    this.currentQuestion.userAnswer = value;

    console.log(`✅ Benar/Salah selected: "${value}"`);

    // Add haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    // Save state
    this.saveQuizState();
  }


  saveAnswer(): void {
    // Untuk pilihan ganda, tetap gunakan transform
    if (this.currentQuestion?.type === 'pilihan_ganda' && this.currentQuestion.userAnswer !== undefined) {
      const selectedIndex = this.currentQuestion.userAnswer as number;
      const selectedOption = this.currentQuestion.options?.[selectedIndex];

      if (selectedOption) {
        // Keep as index for pilihan_ganda - akan ditransform di generateFinalAnswers
        console.log(`✅ Pilihan Ganda answer: index ${selectedIndex}`);
      }
    }

    // Untuk benar_salah, sudah disimpan langsung sebagai "Benar"/"Salah" di selectBenarSalah()
    // Untuk isian_singkat, langsung simpan text

    this.saveQuizState();
  }

  generateFinalAnswers(): any[] {
    if (!this.quiz) return [];

    return this.quiz.questions.map((question, index) => {
      let studentAnswer = question.userAnswer;

      if (question.type === 'pilihan_ganda') {
        // Untuk pilihan ganda, convert index ke label (0 -> "A", 1 -> "B", etc.)
        if (typeof studentAnswer === 'number' && question.options) {
          const selectedOption = question.options[studentAnswer];
          studentAnswer = selectedOption ? selectedOption.charAt(0) : undefined; // "A. Option" -> "A"
        }
      } else if (question.type === 'benar_salah') {
        // Untuk benar/salah, sudah dalam format "Benar" atau "Salah"
        // Tidak perlu transform
      }
      // Untuk isian_singkat, langsung gunakan text yang diinput

      return {
        question_index: index,
        student_answer: studentAnswer?.toString() || ""
      };
    });
  }

  isQuestionAnswered(index: number): boolean {
    if (!this.quiz) return false;
    const question = this.quiz.questions[index];

    if (question.type === 'benar_salah') {
      return question.userAnswer === 'Benar' || question.userAnswer === 'Salah';
    }

    return question.userAnswer !== undefined &&
      question.userAnswer !== null &&
      question.userAnswer !== '';
  }

  finishQuiz(): void {
    if (!this.quiz) return;

    // ✅ Generate final answers dalam format yang benar
    const finalAnswers = this.generateFinalAnswers();

    console.log('📝 Final quiz answers:', finalAnswers);

    // Save final answers to localStorage untuk modal
    localStorage.setItem(`quiz_${this.materialId}_final_answers`, JSON.stringify({
      answers: finalAnswers
    }));

    this.saveQuizState();
    this.showEndModal();
  }

  private showEndModal(): void {
    const initialState = {
      quizId: this.quiz?.id,
      materialId: this.materialId,
    };

    // this.modalService.show(ModalEndQuizComponent, {
    //   class: 'modal-dialog-centered',
    //   initialState
    // });

    const modalRef = this.modalService.show(ModalEndQuizComponent, {
      class: 'modal-dialog-centered',
      initialState
    });

    modalRef.onHidden?.subscribe(() => {
      const quizState = localStorage.getItem(`quiz_${this.materialId}_state`);
      if (quizState && this.quiz) {
        this.startTimer();
      }
    });
  }

  private clearQuizState(): void {
    localStorage.removeItem(`quiz_${this.materialId}_state`);

    localStorage.removeItem(`quiz_${this.materialId}_timer`);

    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
  }

  getBenarSalahSelection(index: number): boolean {
    if (!this.currentQuestion || this.currentQuestion.type !== 'benar_salah') return false;

    const userAnswer = this.currentQuestion.userAnswer as string;
    const option = this.currentQuestion.options?.[index];

    if (!option || !userAnswer) return false;

    // Check if the stored answer matches this option
    const optionText = option.split('. ')[1]; // "A. Benar" -> "Benar"
    return userAnswer === optionText;
  }

  onBenarSalahChange(selectedIndex: number): void {
    if (!this.currentQuestion || this.currentQuestion.type !== 'benar_salah') return;

    const selectedOption = this.currentQuestion.options?.[selectedIndex];
    if (selectedOption) {
      // Extract "Benar" atau "Salah" dari "A. Benar" atau "B. Salah"
      const answerText = selectedOption.split('. ')[1];
      this.currentQuestion.userAnswer = answerText;

      console.log(`✅ Benar/Salah selected: ${selectedIndex} -> "${answerText}"`);
      this.saveQuizState();
    }
  }

  confirmExit(): void {
    if (!this.quiz) return;

    // if (this.timerSubscription) {
    //   this.timerSubscription.unsubscribe();
    // }

    this.saveQuizState();
    this.showEndModal();
  }
}
