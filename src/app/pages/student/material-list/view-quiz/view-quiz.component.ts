import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { interval, Subscription } from 'rxjs';
import { ModalEndQuizComponent } from '../modal-end-quiz/modal-end-quiz.component';

interface QuizQuestion {
  id: number;
  type: 'multiple-choice' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  userAnswer?: string | number;
}

interface Quiz {
  id: number;
  title: string;
  timeLimit: number; // in seconds
  questions: QuizQuestion[];
}

@Component({
  selector: 'app-view-quiz',
  templateUrl: './view-quiz.component.html',
  styleUrls: ['./view-quiz.component.css']
})
export class ViewQuizComponent implements OnInit, OnDestroy {
  quiz: Quiz = {
    id: 1,
    title: 'Akhiri Kuis',
    timeLimit: 1000, // 10 minutes
    questions: [
      {
        id: 1,
        type: 'multiple-choice',
        question: 'Bagaimana sikap yang benar saat mengomentari postingan teman di internet?',
        options: [
          'Menggunakan kata-kata kasar agar teman merasa malu',
          'Memberikan komentar yang sopan dan membangun',
          'Menghina teman karena pendapatnya berbeda',
          'Tidak peduli dan mengabaikan teman'
        ],
        correctAnswer: 1
      },
      {
        id: 2,
        type: 'short-answer',
        question: 'Bagaimana pendapat anda mengenai penyebaran berita hoax di internet?',
        correctAnswer: ''
      },
      {
        id: 3,
        type: 'multiple-choice',
        question: 'Apa yang sebaiknya dilakukan ketika menemukan informasi di internet?',
        options: [
          'Langsung mempercayai informasi tersebut',
          'Membagikan informasi tersebut ke semua teman',
          'Mengecek kebenaran informasi dari beberapa sumber',
          'Mengabaikan semua informasi'
        ],
        correctAnswer: 2
      },
      {
        id: 4,
        type: 'multiple-choice',
        question: 'Apa yang dimaksud dengan etika digital?',
        options: [
          'Cara menggunakan gadget',
          'Aturan penggunaan internet yang baik dan benar',
          'Hukum tentang internet',
          'Cara menginstal aplikasi'
        ],
        correctAnswer: 1
      },
      {
        id: 5,
        type: 'short-answer',
        question: 'Jelaskan bagaimana cara anda menjaga privasi saat menggunakan media sosial?',
        correctAnswer: ''
      },
      {
        id: 6,
        type: 'short-answer',
        question: 'Jelaskan bagaimana cara anda menjaga privasi saat menggunakan media sosial?',
        correctAnswer: ''
      }
    ]
  };

  currentQuestionIndex: number = 0;
  remainingTime: number = 0;
  timerSubscription?: Subscription;
  materialId: string = '';

  get currentQuestion(): QuizQuestion {
    return this.quiz.questions[this.currentQuestionIndex];
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    // Get material ID from route
    this.route.params.subscribe(params => {
      this.materialId = params['id'] || '1';
      
      // Load quiz data (in a real app this would be from an API)
      this.loadQuizState();
      this.startTimer();
    });
  }

  ngOnDestroy(): void {
    this.saveQuizState();
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  loadQuizState(): void {
    // Check localStorage for saved quiz state
    const savedState = localStorage.getItem(`quiz_${this.materialId}_state`);
    
    if (savedState) {
      const state = JSON.parse(savedState);
      this.currentQuestionIndex = state.currentQuestionIndex || 0;
      
      // Load saved answers
      if (state.answers) {
        state.answers.forEach((answer: any, index: number) => {
          if (index < this.quiz.questions.length) {
            this.quiz.questions[index].userAnswer = answer;
          }
        });
      }
    }
    
    // Check timer
    const savedTimer = localStorage.getItem(`quiz_${this.materialId}_timer`);
    if (savedTimer) {
      const timerData = JSON.parse(savedTimer);
      const elapsedTime = Math.floor((Date.now() - timerData.startTime) / 1000);
      this.remainingTime = Math.max(0, timerData.remainingTime - elapsedTime);
    } else {
      this.remainingTime = this.quiz.timeLimit;
    }
  }

  saveQuizState(): void {
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
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.remainingTime > 0) {
        this.remainingTime--;
        // Save timer state every 10 seconds
        if (this.remainingTime % 10 === 0) {
          this.saveQuizState();
        }
      } else {
        // Time's up - automatically submit the quiz
        // this.finishQuiz();
        this.remainingTime = 30;
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
    if (this.currentQuestionIndex < this.quiz.questions.length - 1) {
      this.currentQuestionIndex++;
      this.saveQuizState();
    }
  }

  goToQuestion(index: number): void {
    if (index >= 0 && index < this.quiz.questions.length) {
      this.currentQuestionIndex = index;
      this.saveQuizState();
    }
  }

  saveAnswer(): void {
    this.saveQuizState();
  }

  isQuestionAnswered(index: number): boolean {
    const question = this.quiz.questions[index];
    return question.userAnswer !== undefined && question.userAnswer !== null && question.userAnswer !== '';
  }

  // Update the finishQuiz method
finishQuiz(): void {
  // Save final state
  this.saveQuizState();
  
  // Calculate score (for multiple choice questions)
  let correctAnswers = 0;
  let totalMultipleChoice = 0;
  
  this.quiz.questions.forEach(question => {
    if (question.type === 'multiple-choice') {
      totalMultipleChoice++;
      if (question.userAnswer === question.correctAnswer) {
        correctAnswers++;
      }
    }
  });
  
  const score = totalMultipleChoice > 0 ? Math.round((correctAnswers / totalMultipleChoice) * 100) : 0;
  
  // Save quiz result to localStorage for the result page
  const quizResult = {
    quizId: this.quiz.id,
    materialId: this.materialId,
    completedAt: new Date().toISOString(),
    totalQuestions: this.quiz.questions.length,
    score: score,
    questions: this.quiz.questions.map(q => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      userAnswer: q.userAnswer,
      isCorrect: q.type === 'multiple-choice' ? q.userAnswer === q.correctAnswer : null
    }))
  };
  
  localStorage.setItem(`quiz_result_${this.materialId}`, JSON.stringify(quizResult));
  
  const initialState = {
    quizId: this.quiz.id,
    materialId: this.materialId
  };
  this.modalService.show(ModalEndQuizComponent, { 
    class: 'modal-dialog-centered',
    initialState 
  });
  
  // Clear timer subscription
  if (this.timerSubscription) {
    this.timerSubscription.unsubscribe();
  }
}

  confirmExit(): void {
    const confirmed = confirm('Apakah Anda yakin ingin keluar dari kuis? Progres Anda akan disimpan.');
    if (confirmed) {
      this.saveQuizState();
      this.router.navigate(['/siswa/materi/lihat-materi', this.materialId]);
    }
  }
}
