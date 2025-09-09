import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { StudentProgressService } from '../../../../service/student-progress.service';

interface QuizResultQuestion {
  id: number;
  question: string;
  questionHtml?: SafeHtml;
  type: 'multiple-choice' | 'short-answer' | 'benar-salah';
  options: string[];
  optionsHtml?: SafeHtml[];
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
    private studentProgressService: StudentProgressService,
    private sanitizer: DomSanitizer // ✅ TAMBAH: DomSanitizer untuk sanitize HTML
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.materialId = params['id'] || '1';

      this.route.queryParams.subscribe(queryParams => {
        const attemptId = queryParams['attemptId'];

        if (attemptId) {
          this.loadAttemptFromAPI(attemptId);
        } else {
          setTimeout(() => {
            this.loadQuizResult();
          }, 100);
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

  buildQuizResultFromAPI(attempt: any): void {
  console.log('🔧 Building quiz result from API:', attempt);

  this.quizResult = {
    quizId: attempt.attempt_number || 1,
    materialId: this.materialId,
    completedAt: attempt.completed_at,
    totalQuestions: attempt.total_questions,
    score: attempt.score,
    questions: attempt.detailed_answers.map((answer: any) => {
      const originalQuestion = answer.question_data.question;
      const originalOptions = answer.question_data.options || [];

      console.log('🔍 Processing question:', {
        index: answer.question_index,
        type: answer.question_data.type,
        originalQuestion: originalQuestion.substring(0, 50) + '...',
        correctAnswer: answer.question_data.correct_answer,
        studentAnswer: answer.student_answer,
        isCorrect: answer.is_correct
      });

      // ✅ PERBAIKAN: Handle berbagai tipe soal dengan logging yang lebih detail
      let questionType: 'multiple-choice' | 'short-answer' | 'benar-salah';
      let correctAnswer: string | number;
      let userAnswer: string | number;

      if (answer.question_data.type === 'pilihan_ganda') {
        questionType = 'multiple-choice';
        correctAnswer = answer.question_data.correct_answer.charCodeAt(0) - 65;
        userAnswer = answer.student_answer ? answer.student_answer.charCodeAt(0) - 65 : -1;
      } else if (answer.question_data.type === 'benar_salah') {
        questionType = 'benar-salah';
        correctAnswer = answer.question_data.correct_answer;
        userAnswer = answer.student_answer || '';
        
        console.log('🔍 Benar/Salah question details:', {
          correctAnswer,
          userAnswer,
          isCorrect: answer.is_correct,
          options: originalOptions
        });
      } else {
        questionType = 'short-answer';
        correctAnswer = answer.question_data.correct_answer;
        userAnswer = answer.student_answer;
      }

      const question: QuizResultQuestion = {
        id: answer.question_index + 1,
        question: originalQuestion,
        questionHtml: this.sanitizeHtml(originalQuestion),
        type: questionType,
        options: originalOptions,
        optionsHtml: originalOptions.map((opt: string) => this.sanitizeHtml(opt)),
        correctAnswer: correctAnswer,
        userAnswer: userAnswer,
        isCorrect: answer.is_correct
      };

      console.log('✅ Built question result:', {
        id: question.id,
        type: question.type,
        correctAnswer: question.correctAnswer,
        userAnswer: question.userAnswer,
        isCorrect: question.isCorrect,
        hasOptions: question.options.length > 0
      });

      return question;
    })
  };

  console.log('✅ Built complete quiz result:', {
    totalQuestions: this.quizResult.totalQuestions,
    score: this.quizResult.score,
    questionsWithAnswers: this.quizResult.questions.filter(q => q.userAnswer !== null && q.userAnswer !== '').length
  });
}

  loadQuizResult(): void {
    console.log('🔍 Loading quiz result from localStorage for material:', this.materialId);

    const savedResult = localStorage.getItem(`quiz_result_${this.materialId}`);

    if (savedResult) {
      console.log('📊 Found saved result:', savedResult);

      try {
        this.quizResult = JSON.parse(savedResult);

        console.log('✅ Parsed quiz result:', this.quizResult);

        // ✅ Process existing questions to add HTML content dan type validation
        this.quizResult.questions = this.quizResult.questions.map(question => {
          // ✅ TAMBAH: Ensure type compatibility untuk backward compatibility
          let questionType = question.type;
          if (questionType !== 'multiple-choice' && questionType !== 'short-answer' && questionType !== 'benar-salah') {
            // Fallback logic untuk detect type
            if (question.options && question.options.length === 2) {
              questionType = 'benar-salah';
            } else if (question.options && question.options.length > 2) {
              questionType = 'multiple-choice';
            } else {
              questionType = 'short-answer';
            }
          }

          return {
            ...question,
            type: questionType,
            questionHtml: this.sanitizeHtml(question.question),
            optionsHtml: question.options.map((option: string) => this.sanitizeHtml(option))
          };
        });

        console.log('✅ Processed quiz result with HTML content:', this.quizResult);
      } catch (error) {
        console.error('❌ Error parsing saved result:', error);
        this.error = 'Error loading quiz result';
      }
    } else {
      console.log('⚠️ No saved result found in localStorage');
      console.log('🔍 Available localStorage keys:', Object.keys(localStorage));
      this.error = 'No quiz result found. Please take the quiz first.';
    }
  }

  // Method untuk sanitize HTML content
  sanitizeHtml(html: string): SafeHtml {
    if (!html) return this.sanitizer.bypassSecurityTrustHtml('');

    console.log('🧹 Sanitizing HTML:', html.substring(0, 100) + '...');

    // Bypass security untuk semua HTML content
    const sanitizedHtml = this.sanitizer.bypassSecurityTrustHtml(html);

    return sanitizedHtml;
  }

  // Method untuk cek apakah question mengandung HTML/gambar
  hasHtmlContent(content: string): boolean {
    if (!content) return false;

    const hasHtml = content.includes('<img') ||
      content.includes('<figure') ||
      content.includes('<p>') ||
      content.includes('<div>') ||
      content.includes('<') ||
      content.includes('base64');

    return hasHtml;
  }

  hasOptionHtmlContent(option: string): boolean {
    if (!option) return false;
    return this.hasHtmlContent(option);
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
      hour12: false
    };

    return date.toLocaleDateString('id-ID', options).replace(',', ' pukul').replace(/(\d{2})\.(\d{2})/, '$1:$2');
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

  getBenarSalahTextClass(option: string): string {
    const optionText = this.getBenarSalahOptionText(option);

    if (optionText === 'Benar') {
      return 'text-benar';
    } else if (optionText === 'Salah') {
      return 'text-salah';
    }

    return '';
  }

  shouldShowCorrectAnswer(question: QuizResultQuestion, optionIndex: number): boolean {
    if (question.type === 'benar-salah') {
      // Untuk benar_salah, check berdasarkan text option
      const optionText = this.getBenarSalahOptionText(question.options[optionIndex]);
      return optionText === question.correctAnswer && question.isCorrect === true;
    }
    return optionIndex === question.correctAnswer && question.isCorrect === true;
  }

  getBenarSalahOptionText(option: string): string {
    if (!option) return '';

    // Extract "Benar" dari "A. Benar" atau "B. Salah"
    const parts = option.split('. ');
    return parts.length > 1 ? parts[1] : option;
  }

  shouldShowIncorrectAnswer(question: QuizResultQuestion, optionIndex: number): boolean {

    if (question.type === 'benar-salah') {
      const optionText = this.getBenarSalahOptionText(question.options[optionIndex]);
      return optionText === question.userAnswer && question.isCorrect === false;
    }

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

    if (question.type === 'benar-salah') {
      const optionText = this.getBenarSalahOptionText(question.options[optionIndex]);

      if (optionText === question.correctAnswer && question.isCorrect === true) {
        return 'correct-answer';
      }

      if (optionText === question.userAnswer && question.isCorrect === false) {
        return 'user-incorrect';
      }

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

    if (question.type === 'benar-salah') {
      const optionText = this.getBenarSalahOptionText(question.options[optionIndex]);

      // Jika ini jawaban yang benar DAN user menjawab benar
      if (optionText === question.correctAnswer && question.isCorrect === true) {
        return 'correct';
      }

      // Jika ini jawaban user DAN user menjawab salah
      if (optionText === question.userAnswer && question.isCorrect === false) {
        return 'incorrect';
      }

      return 'neutral';
    }

    // Logic original untuk multiple-choice
    if (this.shouldShowCorrectAnswer(question, optionIndex)) {
      return 'correct';
    }

    if (this.shouldShowIncorrectAnswer(question, optionIndex)) {
      return 'incorrect';
    }

    return 'neutral';
  }

  isCorrectOption(question: QuizResultQuestion, optionIndex: number): boolean {
    if (question.type === 'benar-salah') {
      const optionText = this.getBenarSalahOptionText(question.options[optionIndex]);
      return optionText === question.correctAnswer && question.isCorrect === true;
    }
    return this.shouldShowCorrectAnswer(question, optionIndex);
  }

  isIncorrectUserOption(question: QuizResultQuestion, optionIndex: number): boolean {
    if (question.type === 'benar-salah') {
      const optionText = this.getBenarSalahOptionText(question.options[optionIndex]);
      return optionText === question.userAnswer && question.isCorrect === false;
    }
    return this.shouldShowIncorrectAnswer(question, optionIndex);
  }

  goBack(): void {
    this.router.navigate(['/siswa/materi/lihat-materi', this.materialId, 'kuis']);
  }

  goPredicate() {
    // Implementation untuk lihat predikat
  }

  getPredikatTitle(): string {
    const score = this.quizResult.score;
    if (score < 75) return 'Pemula Literasi Digital';
    if (score >= 75 && score < 90) return 'Sahabat Literasi Digital';
    return 'Jagoan Literasi Digital';
  }

  getPredikatDescription(): string {
    const score = this.quizResult.score;
    if (score < 75) return 'Terus berlatih dan jangan menyerah!';
    if (score >= 75 && score < 90) return 'Kamu sudah memahami materi ini!';
    return 'Luar biasa! Kamu adalah jagoan literasi digital!';
  }

  getPredikatIconPath(): string {
    const score = this.quizResult.score;
    if (score < 75) return 'assets/img/3rd-place.png';
    if (score >= 75 && score < 90) return 'assets/img/2nd-place.png';
    return 'assets/img/1st-place.png';
  }

  getPredikatClass(): string {
    const score = this.quizResult.score;
    if (score < 75) return 'pemula';
    if (score >= 75 && score < 90) return 'sahabat';
    return 'jagoan';
  }

  getProgressPercentage(): number {
    return this.quizResult.score;
  }

  getAchievementHeaderClass(): string {
    const score = this.quizResult.score;
    if (score < 75) return 'achievement-low';
    if (score < 90) return 'achievement-mid';
    return 'achievement-high';
  }

  getScoreRating(): string {
    const score = this.quizResult.score;
    if (score < 50) return 'Ayo semangat!';
    if (score >= 50 && score < 60) return 'Lumayan!';
    if (score >= 60 && score < 70) return 'Bagus!';
    if (score >= 70 && score < 80) return 'Hebat!';
    if (score >= 80 && score < 90) return 'Luar biasa!';
    if (score >= 90 && score < 100) return 'Sangat hebat!';
    return 'Sempurna!';
  }

  // ✅ TAMBAH: Helper Methods
  getCorrectCount(): number {
    return this.quizResult.questions.filter(q => q.isCorrect === true).length;
  }
}
