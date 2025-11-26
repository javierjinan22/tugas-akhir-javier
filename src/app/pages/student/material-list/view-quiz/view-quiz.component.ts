import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { interval, Observable, Subscription } from 'rxjs';
import { ModalEndQuizComponent } from '../modal-end-quiz/modal-end-quiz.component';
import { StudentProgressService } from '../../../../service/student-progress.service';
import { CanComponentDeactivate } from '../../../../guards/quiz-guard.service';

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
export class ViewQuizComponent implements OnInit, OnDestroy, CanComponentDeactivate {
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

  private quizCompleted: boolean = false;
  private modalShown: boolean = false;

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

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    if (this.quizCompleted || !this.quiz) {
      return true;
    }
    return false;
  }

  isQuizActive(): boolean {
    return !this.quizCompleted && !!this.quiz && this.remainingTime > 0;
  }

  // IMPLEMENTASI method untuk guard 
  forceSaveAllAnswers(): void {
    if (!this.quiz) return;

    this.quiz.questions.forEach((question, index) => {
      if (question.type === 'pilihan_ganda') {
        const radioInput: any = document.querySelector(`input[name="question${index}"]:checked`);
        if (radioInput) {
          const value = parseInt(radioInput.value, 10);
          question.userAnswer = value;
        }
      } else if (question.type === 'benar_salah') {
        // Benar/salah sudah tersimpan via selectBenarSalah
        console.log(`Benar/Salah question ${index}: ${question.userAnswer}`);
      } else if (question.type === 'isian_singkat') {
        const textArea: any = document.querySelector(`textarea[name="question${index}"]`);
        if (textArea) {
          question.userAnswer = textArea.value;
          console.log(`Force saved isian singkat ${index}: ${textArea.value}`);
        }
      }
    });

    // Simpan final answers ke localStorage untuk modal
    const finalAnswers = this.generateFinalAnswers();
    localStorage.setItem(`quiz_${this.materialId}_final_answers`, JSON.stringify({
      answers: finalAnswers
    }));

    // Simpan state
    this.saveQuizState();
    console.log('All answers force saved');
  }

  // Prevent browser back button
  @HostListener('window:popstate', ['$event'])
  onPopState(event: any): void {
    if (this.isQuizActive() && !this.modalShown) {
      history.pushState(null, '', window.location.href);
      this.modalShown = true; // Set flag
      this.showEndModal();
    }
  }

  // Prevent page refresh
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: any): void {
    if (this.isQuizActive()) {
      event.preventDefault();
      event.returnValue = 'Kuis sedang berlangsung. Yakin ingin keluar?';
      return event.returnValue;
    }
  }

  private setupAutoSaveListeners(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.quiz) {
        this.forceSaveState();
      }
    });

    window.addEventListener('beforeunload', () => {
      if (this.quiz) {
        this.forceSaveState();
      }
    });

    window.addEventListener('blur', () => {
      if (this.quiz) {
        this.forceSaveState();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.quiz) {
      this.forceSaveState();
    }

    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

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

          this.quiz = {
            id: materialData.id,
            title: materialData.title,
            timeLimit: (materialData.waktu_pengerjaan || 10) * 60,
            questions: quizData.questions.map((q: any, index: number) => ({
              id: index,
              type: q.type,
              question: q.question,
              options: q.options || [],
              correctAnswer: q.correct_answer,
              userAnswer: undefined
            }))
          };

          // Set quiz start time
          const startTimeKey = `quiz_${this.materialId}_start_time`;
          if (!localStorage.getItem(startTimeKey)) {
            const startTime = new Date().toISOString();
            localStorage.setItem(startTimeKey, startTime);
          }

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

    const completedResult = localStorage.getItem(`quiz_result_${this.materialId}`);
    if (completedResult) {
      this.clearQuizState();
      this.remainingTime = this.quiz.timeLimit;
      this.saveTimerState();
      return;
    }

    const savedState = localStorage.getItem(`quiz_${this.materialId}_state`);

    if (savedState) {
      const state = JSON.parse(savedState);
      this.currentQuestionIndex = state.currentQuestionIndex || 0;

      if (state.answers) {
        state.answers.forEach((answer: any, index: number) => {
          if (index < this.quiz!.questions.length) {
            this.quiz!.questions[index].userAnswer = answer;
          }
        });
      }

      const savedTimer = localStorage.getItem(`quiz_${this.materialId}_timer`);
      if (savedTimer) {
        try {
          const timerData = JSON.parse(savedTimer);
          const now = Date.now();
          const elapsedTime = Math.floor((now - timerData.lastSavedTime) / 1000);
          const timeLeft = timerData.remainingTime - elapsedTime;

          if (timeLeft <= 0) {
            this.remainingTime = 0;
            setTimeout(() => this.finishQuiz(), 100);
            return;
          } else {
            this.remainingTime = timeLeft;
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

  saveQuizState(): void {
    if (!this.quiz) return;

    const answers = this.quiz.questions.map(q => q.userAnswer || null);

    const stateData = {
      currentQuestionIndex: this.currentQuestionIndex,
      answers,
      lastSaved: Date.now()
    };

    localStorage.setItem(`quiz_${this.materialId}_state`, JSON.stringify(stateData));

    // Ensure start_time is saved
    const startTimeKey = `quiz_${this.materialId}_start_time`;
    if (!localStorage.getItem(startTimeKey)) {
      const fallbackStartTime = new Date(Date.now() - ((this.quiz.timeLimit - this.remainingTime) * 1000));
      localStorage.setItem(startTimeKey, fallbackStartTime.toISOString());
      console.log('Saved fallback start time:', fallbackStartTime);
    }

    this.saveTimerState();
  }

  private saveTimerState(): void {
    const timerData = {
      remainingTime: this.remainingTime,
      lastSavedTime: Date.now(),
      totalTime: this.quiz?.timeLimit || 600
    };

    localStorage.setItem(`quiz_${this.materialId}_timer`, JSON.stringify(timerData));
  }

  startTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

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
    console.log('Force saved quiz and timer state');
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

    this.currentQuestion.userAnswer = value;
    console.log(`Benar/Salah selected: "${value}"`);

    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    this.saveQuizState();
  }

  saveAnswer(): void {
    if (!this.currentQuestion) return;

    console.log(`💾 Saving answer for question ${this.currentQuestionIndex}:`, {
      type: this.currentQuestion.type,
      userAnswer: this.currentQuestion.userAnswer,
      typeof: typeof this.currentQuestion.userAnswer
    });

    this.saveQuizState();
  }

  generateFinalAnswers(): any[] {
    if (!this.quiz) return [];

    return this.quiz.questions.map((question, index) => {
      let studentAnswer = question.userAnswer;

      if (question.type === 'pilihan_ganda') {
        if (typeof studentAnswer === 'number' && question.options) {
          const selectedOption = question.options[studentAnswer];
          studentAnswer = selectedOption ? selectedOption.charAt(0) : undefined;
        }
      }

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

    console.log('🏁 Finishing quiz with current answers:',
      this.quiz.questions.map(q => ({ type: q.type, userAnswer: q.userAnswer }))
    );

    this.quizCompleted = true;
    this.modalShown = true; // Set flag untuk prevent double

    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    this.forceSaveAllAnswers();

    const finalAnswers = this.generateFinalAnswers();
    console.log('Final quiz answers before modal:', finalAnswers);

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

    const modalRef = this.modalService.show(ModalEndQuizComponent, {
      class: 'modal-dialog-centered',
      initialState,
      ignoreBackdropClick: true,
      keyboard: false
    });

    modalRef.onHidden?.subscribe(() => {
      this.modalShown = false;

      const quizState = localStorage.getItem(`quiz_${this.materialId}_state`);
      if (!quizState) {
        this.quizCompleted = true;
        console.log('✅ Quiz completed and data cleared');
      } else if (this.quiz && !this.quizCompleted) {
        console.log('⚠️ User cancelled modal, resuming quiz');
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

  isBenarSalahSelected(value: 'Benar' | 'Salah'): boolean {
    if (!this.currentQuestion || this.currentQuestion.type !== 'benar_salah') return false;
    return this.currentQuestion.userAnswer === value;
  }

  getBenarSalahSelection(index: number): boolean {
    if (!this.currentQuestion || this.currentQuestion.type !== 'benar_salah') return false;

    const userAnswer = this.currentQuestion.userAnswer as string;
    const option = this.currentQuestion.options?.[index];

    if (!option || !userAnswer) return false;

    const optionText = option.split('. ')[1];
    return userAnswer === optionText;
  }

  onBenarSalahChange(selectedIndex: number): void {
    if (!this.currentQuestion || this.currentQuestion.type !== 'benar_salah') return;

    const selectedOption = this.currentQuestion.options?.[selectedIndex];
    if (selectedOption) {
      const answerText = selectedOption.split('. ')[1];
      this.currentQuestion.userAnswer = answerText;

      console.log(`Benar/Salah selected: ${selectedIndex} -> "${answerText}"`);
      this.saveQuizState();
    }
  }

  confirmExit(): void {
    if (!this.quiz || this.modalShown) return; // Check flag

    this.saveQuizState();
    this.modalShown = true; // Set flag
    this.showEndModal();
  }
}
