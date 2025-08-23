import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentProgressService } from '../../../../service/student-progress.service';

interface QuizResultQuestion {
  id: number;
  question: string;
  type: 'multiple-choice' | 'short-answer';
  options: string[];
  correctAnswer: string | number;
  userAnswer: string | number;
  isCorrect: boolean | null;
}

interface QuizResult {
  quizId: number;
  materialId: string;
  completedAt: string;
  totalQuestions: number;
  score: number;
  questions: QuizResultQuestion[];
}

@Component({
  selector: 'app-detail-history-quiz',
  templateUrl: './detail-history-quiz.component.html',
  styleUrls: ['./detail-history-quiz.component.css']
})
export class DetailHistoryQuizComponent implements OnInit {

  quizResult: QuizResult = {
    quizId: 1,
    materialId: '1',
    completedAt: '2025-05-25T22:39:45.000Z',
    totalQuestions: 5,
    score: 80,
    questions: []
  };

  materialId: string = '';
  loading: boolean = false;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentProgressService: StudentProgressService 
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.materialId = params['id'] || '1';
      
      this.route.queryParams.subscribe(queryParams => {
        const attemptId = queryParams['attemptId'];
        
        if (attemptId) {
          this.loadAttemptFromAPI(attemptId);
        } else {
          this.loadQuizResult();
        }
      });
    });
  }

  // Method untuk load attempt dari API
  loadAttemptFromAPI(attemptId: string): void {
    this.loading = true;
    this.error = '';

    this.studentProgressService.getQuizAttemptDetail(this.materialId, attemptId).subscribe({
      next: (response) => {
        console.log('📊 API Response:', response);
        
        if (response.success) {
          this.buildQuizResultFromAPI(response.data.attempt);
        } else {
          this.error = 'Gagal memuat detail attempt';
          this.loadQuizResult();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error loading attempt detail:', error);
        this.error = 'Gagal memuat detail attempt';
        this.loading = false;
        
        // Fallback ke localStorage
        this.loadQuizResult();
      }
    });
  }

  // ✅ TAMBAH: Build quiz result dari API response
  buildQuizResultFromAPI(attempt: any): void {
    console.log('🔧 Building quiz result from API:', attempt);

    this.quizResult = {
      quizId: attempt.attempt_number || 1,
      materialId: this.materialId,
      completedAt: attempt.completed_at,
      totalQuestions: attempt.total_questions,
      score: attempt.score,
      questions: attempt.detailed_answers.map((answer: any) => ({
        id: answer.question_index + 1,
        question: this.stripHtmlTags(answer.question_data.question),
        type: answer.question_data.type === 'pilihan_ganda' ? 'multiple-choice' : 'short-answer',
        options: answer.question_data.options ? 
          answer.question_data.options.map((opt: string) => this.stripHtmlTags(opt)) : [],
        // ✅ Convert letter answers (A,B,C,D) to index (0,1,2,3)
        correctAnswer: answer.question_data.type === 'pilihan_ganda' ? 
          answer.question_data.correct_answer.charCodeAt(0) - 65 : 
          answer.question_data.correct_answer,
        userAnswer: answer.question_data.type === 'pilihan_ganda' ? 
          answer.student_answer.charCodeAt(0) - 65 : 
          answer.student_answer,
        isCorrect: answer.is_correct
      }))
    };

    console.log('✅ Built quiz result:', this.quizResult);
  }

  loadQuizResult(): void {
    const savedResult = localStorage.getItem(`quiz_result_${this.materialId}`);

    if (savedResult) {
      this.quizResult = JSON.parse(savedResult);

      this.quizResult.questions = this.quizResult.questions.map(question => ({
        ...question,
        question: this.stripHtmlTags(question.question),
        options: question.options.map(option => this.stripHtmlTags(option))
      }));

    } else {
      console.log('⚠️ No saved result found in localStorage');
    }
  }

  stripHtmlTags(text: string): string {
    if (!text) return '';

    const div = document.createElement('div');
    div.innerHTML = text;

    return div.textContent || div.innerText || '';
  }

  getCleanOption(option: string): string {
    return this.stripHtmlTags(option);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };

    return date.toLocaleDateString('id-ID', options).replace(',', ' pukul');
  }

  getScoreBadgeClass(question: QuizResultQuestion): string {
    if (question.type === 'short-answer') {
      return 'not-graded';
    }
    return question.isCorrect ? 'correct' : 'incorrect';
  }

  getQuestionScore(question: QuizResultQuestion): string {
    if (question.type === 'short-answer') {
      return '-';
    }
    return question.isCorrect ? '1' : '0';
  }

  shouldShowCorrectAnswer(question: QuizResultQuestion, optionIndex: number): boolean {
    return optionIndex === question.correctAnswer && question.isCorrect === true;
  }

  shouldShowIncorrectAnswer(question: QuizResultQuestion, optionIndex: number): boolean {
    return optionIndex === question.userAnswer && question.isCorrect === false;
  }

  shouldShowNeutralOption(question: QuizResultQuestion, optionIndex: number): boolean {
    return !this.shouldShowCorrectAnswer(question, optionIndex) && 
           !this.shouldShowIncorrectAnswer(question, optionIndex);
  }

  getOptionClass(question: QuizResultQuestion, optionIndex: number): string {
    if (question.type === 'short-answer') {
      return '';
    }
    
    if (this.shouldShowCorrectAnswer(question, optionIndex)) {
      return 'correct-answer';
    }
    
    if (this.shouldShowIncorrectAnswer(question, optionIndex)) {
      return 'user-incorrect';
    }
    
    return '';
  }

  getOptionIndicatorClass(question: QuizResultQuestion, optionIndex: number): string {
    if (question.type === 'short-answer') {
      return 'neutral';
    }
    
    if (this.shouldShowCorrectAnswer(question, optionIndex)) {
      return 'correct';
    }
    
    if (this.shouldShowIncorrectAnswer(question, optionIndex)) {
      return 'incorrect';
    }
    
    return 'neutral';
  }

  isCorrectOption(question: QuizResultQuestion, optionIndex: number): boolean {
    return this.shouldShowCorrectAnswer(question, optionIndex);
  }

  isIncorrectUserOption(question: QuizResultQuestion, optionIndex: number): boolean {
    return this.shouldShowIncorrectAnswer(question, optionIndex);
  }

  goBack(): void {
    this.router.navigate(['/siswa/materi/lihat-materi', this.materialId, 'kuis']);
  }

  goPredicate() {
    // Implementation untuk lihat predikat
  }
}
