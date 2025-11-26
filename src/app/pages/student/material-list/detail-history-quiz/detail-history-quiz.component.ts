import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { StudentProgressService } from '../../../../service/student-progress.service';

// ✅ INTERFACES - Data Models
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

  // STATE PROPERTIES - Data & Loading State
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
    private sanitizer: DomSanitizer
  ) { }

  /**
   * ENTRY POINT - Inisialisasi komponen
   * ALUR: URL Params → Query Params → Load Data Strategy
   */
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.materialId = params['id'] || '1';

      this.route.queryParams.subscribe(queryParams => {
        const attemptId = queryParams['attemptId'];

        console.log('🔍 DetailHistory: Received params:', {
          materialId: this.materialId,
          attemptId: attemptId,
          hasAttemptId: !!attemptId
        });

        // STRATEGI LOADING DATA:
        // 1. Jika ada attemptId → Load attempt spesifik
        // 2. Jika tidak ada attemptId → Load attempt terbaru
        if (attemptId) {
          console.log('✅ DetailHistory: Loading specific attempt:', attemptId);
          this.loadAttemptFromAPI(attemptId);
        } else {
          console.log('⚠️ DetailHistory: No attemptId, trying latest attempt first...');
          this.loadLatestAttemptFromAPI();
        }
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 📊 DATA LOADING METHODS - Backend API Integration
  // ═══════════════════════════════════════════════════════════════

  /**
   * ✅ LOAD LATEST ATTEMPT - Ambil attempt terbaru jika tidak ada attemptId
   * ALUR: API Material Detail → Get Latest Attempt → Load Specific Attempt
   * FALLBACK: LocalStorage jika API gagal
   */
  loadLatestAttemptFromAPI(): void {
    console.log('🔍 DetailHistory: Loading latest attempt from API...');
    this.loading = true;
    this.error = '';

    this.studentProgressService.getMateriDetailForViewing(this.materialId).subscribe({
      next: (response) => {
        console.log('📊 DetailHistory: Material detail response:', response);

        if (response.success && response.data.quiz.attempts && response.data.quiz.attempts.length > 0) {
          const latestAttempt = response.data.quiz.attempts[0];
          const attemptId = latestAttempt._id || latestAttempt.attempt_id;

          console.log('✅ DetailHistory: Found latest attempt:', attemptId);
          this.loadAttemptFromAPI(attemptId);
        } else {
          console.log('⚠️ DetailHistory: No attempts found, fallback to localStorage');
          this.loadQuizResult();
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('❌ DetailHistory: Error loading material detail:', error);
        console.log('⚠️ DetailHistory: Fallback to localStorage due to API error');
        this.loadQuizResult();
        this.loading = false;
      }
    });
  }

  /**
   * ✅ LOAD SPECIFIC ATTEMPT - Ambil detail attempt berdasarkan attemptId
   * ALUR: API Attempt Detail → Build Quiz Result → Display
   * FALLBACK: LocalStorage jika API gagal
   */
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
        this.loadQuizResult(); // Fallback ke localStorage
      }
    });
  }

  /**
   * ✅ FALLBACK DATA LOADER - Load dari localStorage jika API gagal
   * ALUR: localStorage → Parse JSON → Process HTML Content → Display
   * KEGUNAAN: Backup data source, offline capability
   */
  loadQuizResult(): void {
    console.log('🔍 Loading quiz result from localStorage for material:', this.materialId);

    const savedResult = localStorage.getItem(`quiz_result_${this.materialId}`);

    if (savedResult) {
      console.log('📊 Found saved result:', savedResult);

      try {
        this.quizResult = JSON.parse(savedResult);
        console.log('✅ Parsed quiz result:', this.quizResult);

        // Process existing questions untuk backward compatibility
        this.quizResult.questions = this.quizResult.questions.map(question => {
          // Type validation untuk backward compatibility
          let questionType = question.type;
          if (!['multiple-choice', 'short-answer', 'benar-salah'].includes(questionType)) {
            questionType = this.detectQuestionType(question);
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
      this.error = 'No quiz result found. Please take the quiz first.';
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔄 DATA TRANSFORMATION METHODS - API Response to UI Data
  // ═══════════════════════════════════════════════════════════════

  /**
   * ✅ BUILD QUIZ RESULT FROM API - Transform API response ke format UI
   * ALUR: API Response → Validation → Transform → Set Quiz Result
   * KEGUNAAN: Convert backend data format ke frontend data format
   */
  buildQuizResultFromAPI(attempt: any): void {
    console.log('🔧 DetailHistory: Building quiz result from API:', attempt);

    // VALIDASI 1: Cek ketersediaan detailed_answers
    if (!attempt.detailed_answers || !Array.isArray(attempt.detailed_answers) || attempt.detailed_answers.length === 0) {
      console.log('❌ DetailHistory: No detailed_answers found, fallback to localStorage');
      this.loadQuizResult();
      return;
    }

    // VALIDASI 2: Cek kelengkapan data
    const expectedQuestions = attempt.total_questions || 2;
    const actualAnswers = attempt.detailed_answers.length;

    if (actualAnswers < expectedQuestions) {
      console.log(`⚠️ DetailHistory: Incomplete data (${actualAnswers}/${expectedQuestions}), checking localStorage...`);
      
      // Cek localStorage untuk data yang lebih lengkap
      const savedResult = localStorage.getItem(`quiz_result_${this.materialId}`);
      if (savedResult) {
        try {
          const localData = JSON.parse(savedResult);
          if (localData.questions && localData.questions.length === expectedQuestions) {
            console.log('✅ DetailHistory: Found complete data in localStorage, using it');
            this.loadQuizResult();
            return;
          }
        } catch (e) {
          console.error('Error parsing localStorage:', e);
        }
      }
    }

    // TRANSFORMASI DATA: API Response → Quiz Result Format
    this.quizResult = {
      quizId: attempt.attempt_number || 1,
      materialId: this.materialId,
      completedAt: attempt.completed_at,
      totalQuestions: expectedQuestions,
      score: attempt.score, // SKOR DARI BACKEND
      questions: attempt.detailed_answers.map((answer: any, index: number) => 
        this.transformAnswerToQuestion(answer, index)
      )
    };

    console.log('✅ DetailHistory: Complete quiz result built:', {
      totalQuestions: this.quizResult.totalQuestions,
      actualQuestions: this.quizResult.questions.length,
      score: this.quizResult.score
    });
  }

  /**
   * ✅ TRANSFORM SINGLE ANSWER - Convert API answer format ke question format
   * ALUR: API Answer Data → Type Detection → Format Conversion → Question Object
   * KEGUNAAN: Handle berbagai tipe soal (pilihan ganda, benar/salah, isian)
   */
  private transformAnswerToQuestion(answer: any, index: number): QuizResultQuestion {
    const originalQuestion = answer.question_data?.question || `Soal ${index + 1}`;
    const originalOptions = answer.question_data?.options || [];

    console.log(`🔍 DetailHistory: Processing question ${index}:`, {
      index: answer.question_index,
      type: answer.question_data?.type,
      correctAnswer: answer.question_data?.correct_answer,
      studentAnswer: answer.student_answer,
      isCorrect: answer.is_correct
    });

    // Handle missing question_data
    if (!answer.question_data) {
      return this.createEmptyQuestion(answer, index);
    }

    // DETEKSI TIPE SOAL & KONVERSI FORMAT
    const { questionType, correctAnswer, userAnswer } = this.processAnswerByType(answer);

    return {
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
  }

  /**
   * ✅ PROCESS ANSWER BY TYPE - Handle berbagai tipe soal
   * KEGUNAAN: Convert format jawaban backend ke format frontend berdasarkan tipe
   */
  private processAnswerByType(answer: any): {
    questionType: 'multiple-choice' | 'short-answer' | 'benar-salah',
    correctAnswer: string | number,
    userAnswer: string | number
  } {
    let questionType: 'multiple-choice' | 'short-answer' | 'benar-salah';
    let correctAnswer: string | number;
    let userAnswer: string | number;

    if (answer.question_data.type === 'pilihan_ganda') {
      questionType = 'multiple-choice';
      // Convert A,B,C,D ke index 0,1,2,3
      correctAnswer = answer.question_data.correct_answer ?
        answer.question_data.correct_answer.charCodeAt(0) - 65 : -1;
      userAnswer = (answer.student_answer && answer.student_answer.length > 0) ?
        answer.student_answer.charCodeAt(0) - 65 : -1;
    } else if (answer.question_data.type === 'benar_salah') {
      questionType = 'benar-salah';
      correctAnswer = answer.question_data.correct_answer || '';
      userAnswer = answer.student_answer || '';
    } else {
      questionType = 'short-answer';
      correctAnswer = answer.question_data.correct_answer || '';
      userAnswer = answer.student_answer || '';
    }

    return { questionType, correctAnswer, userAnswer };
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITY METHODS - Helper Functions
  // ═══════════════════════════════════════════════════════════════

  /**
   * HTML SANITIZER - Bersihkan dan amankan HTML content
   * KEGUNAAN: Render HTML content dengan aman (gambar, formatting)
   */
  sanitizeHtml(html: string): SafeHtml {
    if (!html) return this.sanitizer.bypassSecurityTrustHtml('');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  /**
   * HTML CONTENT DETECTOR - Deteksi apakah string mengandung HTML
   * KEGUNAAN: Tentukan rendering strategy (HTML vs plain text)
   */
  hasHtmlContent(content: string): boolean {
    if (!content) return false;
    
    return content.includes('<img') ||
           content.includes('<figure') ||
           content.includes('<p>') ||
           content.includes('<div>') ||
           content.includes('<') ||
           content.includes('base64');
  }

  /**
   * HTML STRIPPER - Hapus tag HTML, ambil text saja
   * KEGUNAAN: Clean text untuk display fallback
   */
  stripHtmlTags(text: string): string {
    if (!text) return '';
    const div = document.createElement('div');
    div.innerHTML = text;
    return div.textContent || div.innerText || '';
  }

  /**
   * QUESTION TYPE DETECTOR - Deteksi tipe soal untuk backward compatibility
   * KEGUNAAN: Handle data lama yang tidak ada type field
   */
  private detectQuestionType(question: any): 'multiple-choice' | 'short-answer' | 'benar-salah' {
    if (question.options && question.options.length === 2) {
      return 'benar-salah';
    } else if (question.options && question.options.length > 2) {
      return 'multiple-choice';
    } else {
      return 'short-answer';
    }
  }

  /**
   * EMPTY QUESTION CREATOR - Buat question object kosong untuk data yang hilang
   * KEGUNAAN: Handle missing data gracefully
   */
  private createEmptyQuestion(answer: any, index: number): QuizResultQuestion {
    return {
      id: answer.question_index + 1,
      question: `Soal ${index + 1}`,
      questionHtml: this.sanitizeHtml(`Soal ${index + 1}`),
      type: 'multiple-choice' as const,
      options: [],
      optionsHtml: [],
      correctAnswer: -1,
      userAnswer: -1,
      isCorrect: answer.is_correct || false
    };
  }

  /**
   * OPTION CLASS GENERATOR - Tentukan CSS class untuk styling option
   * KEGUNAAN: Visual feedback untuk jawaban benar/salah
   */
  getOptionClass(question: QuizResultQuestion, optionIndex: number): string {
    if (question.type === 'short-answer') return '';

    // Hanya styling pada jawaban yang dipilih user
    if (this.isUserSelectedOption(question, optionIndex)) {
      return question.isCorrect === true ? 'correct-answer' : 'user-incorrect';
    }
    return '';
  }

  /**
   * OPTION INDICATOR CLASS - Tentukan icon indicator (check/X)
   * KEGUNAAN: Visual indicator untuk jawaban
   */
  getOptionIndicatorClass(question: QuizResultQuestion, optionIndex: number): string {
    if (question.type === 'short-answer') return 'neutral';

    if (this.isUserSelectedOption(question, optionIndex)) {
      return question.isCorrect === true ? 'correct' : 'incorrect';
    }
    return 'neutral';
  }

  /**
   * ✅ USER SELECTION CHECKER - Cek apakah option dipilih oleh user
   * KEGUNAAN: Tentukan mana jawaban yang dipilih user
   */
  isUserSelectedOption(question: QuizResultQuestion, optionIndex: number): boolean {
    if (question.type === 'multiple-choice') {
      return optionIndex === question.userAnswer;
    } else if (question.type === 'benar-salah') {
      const optionText = this.getBenarSalahOptionText(question.options[optionIndex]);
      return optionText === question.userAnswer;
    }
    return false;
  }

  /**
   * ACHIEVEMENT CALCULATORS - Hitung dan tampilkan pencapaian
   * KEGUNAAN: Visual feedback performa user
   */
  getPredikatTitle(): string {
    const score = this.quizResult.score;
    if (score < 75) return 'Pemula Literasi Digital';
    if (score >= 75 && score < 90) return 'Sahabat Literasi Digital';
    return 'Jagoan Literasi Digital';
  }

  getPredikatIconPath(): string {
    const score = this.quizResult.score;
    if (score < 75) return 'assets/img/3rd-place.png';
    if (score >= 75 && score < 90) return 'assets/img/2nd-place.png';
    return 'assets/img/1st-place.png';
  }

  getAchievementHeaderClass(): string {
    const score = this.quizResult.score;
    if (score < 75) return 'achievement-low';
    if (score < 90) return 'achievement-mid';
    return 'achievement-high';
  }

  // ═══════════════════════════════════════════════════════════════
  // 🚦 NAVIGATION METHODS - Route Management
  // ═══════════════════════════════════════════════════════════════

  /**
   * ✅ NAVIGATION HANDLERS - Handle user navigation
   */
  goBack(): void {
    this.router.navigate(['/siswa/materi/lihat-materi', this.materialId, 'kuis']);
  }

  goPredicate(): void {
    this.router.navigate(['/siswa/riwayat'], {
      queryParams: {
        from: 'quiz-result',
        materialId: this.materialId,
        score: this.quizResult.score,
        timestamp: new Date().toISOString()
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 📅 FORMATTING METHODS - Data Display Formatters
  // ═══════════════════════════════════════════════════════════════

  /**
   * ✅ DATE FORMATTER - Format tanggal untuk display
   */
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
    return date.toLocaleDateString('id-ID', options)
              .replace(',', ' pukul')
              .replace(/(\d{2})\.(\d{2})/, '$1:$2');
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔧 ADDITIONAL UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════

  getCleanOption(option: string): string {
    return this.stripHtmlTags(option);
  }

  getBenarSalahOptionText(option: string): string {
    if (!option) return '';
    const parts = option.split('. ');
    return parts.length > 1 ? parts[1] : option;
  }

  getBenarSalahTextClass(option: string): string {
    const optionText = this.getBenarSalahOptionText(option);
    if (optionText === 'Benar') return 'text-benar';
    if (optionText === 'Salah') return 'text-salah';
    return '';
  }

  shouldShowCorrectAnswer(question: QuizResultQuestion, optionIndex: number): boolean {
    return this.isUserSelectedOption(question, optionIndex) && question.isCorrect === true;
  }

  shouldShowIncorrectAnswer(question: QuizResultQuestion, optionIndex: number): boolean {
    return this.isUserSelectedOption(question, optionIndex) && question.isCorrect === false;
  }

  getQuestionScoreIcon(question: QuizResultQuestion): string {
    if (question.type === 'short-answer') return 'fas fa-minus';
    return question.isCorrect ? 'fas fa-check' : 'fas fa-times';
  }

  getScoreBadgeClass(question: QuizResultQuestion): string {
    if (question.type === 'short-answer') return 'not-graded';
    return question.isCorrect ? 'correct' : 'incorrect';
  }

  getCorrectCount(): number {
    return this.quizResult.questions.filter(q => q.isCorrect === true).length;
  }

  // Unused legacy methods (dapat dihapus jika tidak digunakan)
  getPredikatDescription(): string {
    const score = this.quizResult.score;
    if (score < 75) return 'Terus berlatih dan jangan menyerah!';
    if (score >= 75 && score < 90) return 'Kamu sudah memahami materi ini!';
    return 'Luar biasa! Kamu adalah jagoan literasi digital!';
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

  shouldShowNeutralOption(question: QuizResultQuestion, optionIndex: number): boolean {
    return !this.isUserSelectedOption(question, optionIndex);
  }

  hasOptionHtmlContent(option: string): boolean {
    return this.hasHtmlContent(option);
  }
}
