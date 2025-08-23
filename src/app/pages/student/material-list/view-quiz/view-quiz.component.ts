import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { interval, Subscription } from 'rxjs';
import { ModalEndQuizComponent } from '../modal-end-quiz/modal-end-quiz.component';
import { StudentProgressService } from '../../../../service/student-progress.service';

interface QuizQuestion {
  id: number;
  type: 'pilihan_ganda' | 'isian_singkat';
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
  }

  ngOnDestroy(): void {
    this.saveQuizState();
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  // ✅ Load quiz data dari API
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
              type: q.type === 'pilihan_ganda' ? 'pilihan_ganda' : 'isian_singkat',
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

    // ✅ PERBAIKAN: Check timer dengan validasi yang lebih ketat
    const savedTimer = localStorage.getItem(`quiz_${this.materialId}_timer`);
    if (savedTimer) {
      try {
        const timerData = JSON.parse(savedTimer);
        const elapsedTime = Math.floor((Date.now() - timerData.startTime) / 1000);
        const timeLeft = timerData.remainingTime - elapsedTime;
        
        // ✅ Jika waktu sudah habis atau kurang dari 0, reset timer
        if (timeLeft <= 0) {
          console.log('⏰ Timer expired, resetting to full time');
          this.remainingTime = this.quiz.timeLimit;
          this.clearTimerState(); // Clear hanya timer state
        } else {
          this.remainingTime = Math.max(0, timeLeft);
        }
      } catch (error) {
        console.error('Error parsing timer data:', error);
        this.remainingTime = this.quiz.timeLimit;
      }
    } else {
      this.remainingTime = this.quiz.timeLimit;
    }
  } else {
    // ✅ Fresh start - full time
    this.remainingTime = this.quiz.timeLimit;
  }
}

private clearTimerState(): void {
  localStorage.removeItem(`quiz_${this.materialId}_timer`);
}

  saveQuizState(): void {
    if (!this.quiz) return;

    // Save current question index and answers
    const answers = this.quiz.questions.map(q => q.userAnswer || null);
    
    localStorage.setItem(`quiz_${this.materialId}_state`, JSON.stringify({
      currentQuestionIndex: this.currentQuestionIndex,
      answers
    }));
    
    // Save timer state
    localStorage.setItem(`quiz_${this.materialId}_timer`, JSON.stringify({
      remainingTime: this.remainingTime,
      startTime: Date.now()
    }));
  }

  startTimer(): void {
  // ✅ Stop existing timer if any
  if (this.timerSubscription) {
    this.timerSubscription.unsubscribe();
  }

  this.timerSubscription = interval(1000).subscribe(() => {
    if (this.remainingTime > 0) {
      this.remainingTime--;
      // Save timer state every 10 seconds
      if (this.remainingTime % 10 === 0) {
        this.saveQuizState();
      }
    } else {
      // Time's up - automatically submit the quiz
      this.finishQuiz();
    }
  });
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

  saveAnswer(): void {
    this.saveQuizState();
  }

  isQuestionAnswered(index: number): boolean {
    if (!this.quiz) return false;
    const question = this.quiz.questions[index];
    return question.userAnswer !== undefined && question.userAnswer !== null && question.userAnswer !== '';
  }

  finishQuiz(): void {
  if (!this.quiz) return;

  // ✅ Stop timer sebelum submit
  if (this.timerSubscription) {
    this.timerSubscription.unsubscribe();
  }

  // Save final state
  this.saveQuizState();
  
  // Format answers sesuai yang diharapkan backend
  const answers = this.quiz.questions.map((q, index) => {
    let studentAnswer = '';
    
    if (q.type === 'pilihan_ganda') {
      if (typeof q.userAnswer === 'number') {
        studentAnswer = String.fromCharCode(65 + q.userAnswer);
      } else if (typeof q.userAnswer === 'string') {
        studentAnswer = q.userAnswer;
      } else {
        studentAnswer = '';
      }
    } else {
      studentAnswer = String(q.userAnswer || '');
    }

    return {
      question_index: index,
      student_answer: studentAnswer
    };
  });

  console.log('🔍 Prepared answers for API:', answers);

  // Submit to API
  this.studentProgressService.submitQuizAttempt(this.materialId, answers).subscribe({
    next: (response) => {
      console.log('Quiz submitted successfully:', response);
      
      let score = 0;
      if (response.data?.score !== undefined) {
        score = response.data.score;
      } else {
        score = this.calculateLocalScore();
      }
      
      // Save result and show modal
      this.saveQuizResult(score);
      
      //  Clear state sebelum show modal
      this.clearQuizState();
      
      this.showEndModal();
    },
    error: (error) => {
      console.error('Error submitting quiz:', error);
      const score = this.calculateLocalScore();
      this.saveQuizResult(score);
      
      // Clear state meskipun error
      this.clearQuizState();
      
      this.showEndModal();
    }
  });
}

  private calculateLocalScore(): number {
    if (!this.quiz) return 0;
    
    let correctAnswers = 0;
    let totalMultipleChoice = 0;
    
    this.quiz.questions.forEach(question => {
      if (question.type === 'pilihan_ganda') {
        totalMultipleChoice++;
        const userAnswerLetter = typeof question.userAnswer === 'number' ? 
          String.fromCharCode(65 + question.userAnswer) : question.userAnswer;
        if (userAnswerLetter === question.correctAnswer) {
          correctAnswers++;
        }
      }
    });
    
    return totalMultipleChoice > 0 ? Math.round((correctAnswers / totalMultipleChoice) * 100) : 0;
  }

  private saveQuizResult(score: number): void {
  if (!this.quiz) return;

  const quizResult = {
    quizId: this.quiz.id,
    materialId: this.materialId,
    completedAt: new Date().toISOString(),
    totalQuestions: this.quiz.questions.length,
    score: score,
    questions: this.quiz.questions.map((q, index) => ({
      id: index,
      question: q.question,
      type: q.type === 'pilihan_ganda' ? 'multiple-choice' : 'short-answer',
      options: q.options || [],
      correctAnswer: q.type === 'pilihan_ganda' ? 
        (typeof q.correctAnswer === 'string' ? q.correctAnswer.charCodeAt(0) - 65 : q.correctAnswer) : 
        q.correctAnswer,
      userAnswer: q.type === 'pilihan_ganda' ? 
        (typeof q.userAnswer === 'number' ? q.userAnswer : 
         (typeof q.userAnswer === 'string' && q.userAnswer ? q.userAnswer.charCodeAt(0) - 65 : null)) : 
        q.userAnswer,
      isCorrect: q.type === 'pilihan_ganda' ? 
        (typeof q.userAnswer === 'number' ? String.fromCharCode(65 + q.userAnswer) : q.userAnswer) === q.correctAnswer : 
        null
    }))
  };
  
  console.log('💾 Saving quiz result:', quizResult); // Debug log
  localStorage.setItem(`quiz_result_${this.materialId}`, JSON.stringify(quizResult));
}

  private showEndModal(): void {
    const initialState = {
      quizId: this.quiz?.id,
      materialId: this.materialId
    };
    
    this.modalService.show(ModalEndQuizComponent, { 
      class: 'modal-dialog-centered',
      initialState 
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

  confirmExit(): void {
  const confirmed = confirm('Apakah Anda yakin ingin keluar dari kuis? Progres Anda akan disimpan.');
  if (confirmed) {
    this.saveQuizState();
    
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    
    this.router.navigate(['/siswa/materi/lihat-materi', this.materialId]);
  }
}
}
