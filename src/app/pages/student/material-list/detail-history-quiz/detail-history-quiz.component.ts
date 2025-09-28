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
    private sanitizer: DomSanitizer
  ) { }

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
          // Load detail attempt tersebut
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
    console.log('🔧 DetailHistory: Building quiz result from API:', attempt);
    console.log('🔍 DetailHistory: Detailed answers:', attempt.detailed_answers);

    // ✅ VALIDASI: Pastikan ada detailed_answers dan tidak kosong
    if (!attempt.detailed_answers || !Array.isArray(attempt.detailed_answers) || attempt.detailed_answers.length === 0) {
      console.log('❌ DetailHistory: No detailed_answers found, fallback to localStorage');
      this.loadQuizResult();
      return;
    }

    // ✅ VALIDASI: Cek jika jumlah detailed_answers sesuai dengan total_questions
    const expectedQuestions = attempt.total_questions || 2;
    const actualAnswers = attempt.detailed_answers.length;

    if (actualAnswers < expectedQuestions) {
      console.log(`⚠️ DetailHistory: Incomplete data (${actualAnswers}/${expectedQuestions}), checking localStorage...`);

      // Cek apakah localStorage punya data yang lebih lengkap
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

      console.log('⚠️ DetailHistory: Proceeding with incomplete API data...');
    }

    this.quizResult = {
      quizId: attempt.attempt_number || 1,
      materialId: this.materialId,
      completedAt: attempt.completed_at,
      totalQuestions: expectedQuestions, // Gunakan expected, bukan actual
      score: attempt.score,
      questions: attempt.detailed_answers.map((answer: any, index: number) => {
        const originalQuestion = answer.question_data?.question || `Soal ${index + 1}`;
        const originalOptions = answer.question_data?.options || [];

        console.log(`🔍 DetailHistory: Processing question ${index}:`, {
          index: answer.question_index,
          type: answer.question_data?.type,
          correctAnswer: answer.question_data?.correct_answer,
          studentAnswer: answer.student_answer,
          isCorrect: answer.is_correct,
          hasQuestionData: !!answer.question_data
        });

        // Handle missing question_data
        if (!answer.question_data) {
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

        let questionType: 'multiple-choice' | 'short-answer' | 'benar-salah';
        let correctAnswer: string | number;
        let userAnswer: string | number;

        if (answer.question_data.type === 'pilihan_ganda') {
          questionType = 'multiple-choice';
          correctAnswer = answer.question_data.correct_answer ?
            answer.question_data.correct_answer.charCodeAt(0) - 65 : -1;

          if (answer.student_answer && answer.student_answer.length > 0) {
            userAnswer = answer.student_answer.charCodeAt(0) - 65;
          } else {
            userAnswer = -1;
          }
        } else if (answer.question_data.type === 'benar_salah') {
          questionType = 'benar-salah';
          correctAnswer = answer.question_data.correct_answer || '';
          userAnswer = answer.student_answer || '';
        } else {
          questionType = 'short-answer';
          correctAnswer = answer.question_data.correct_answer || '';
          userAnswer = answer.student_answer || '';
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

        return question;
      })
    };

    console.log('✅ DetailHistory: Complete quiz result built:', {
      totalQuestions: this.quizResult.totalQuestions,
      actualQuestions: this.quizResult.questions.length,
      score: this.quizResult.score
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

  getQuestionScoreIcon(question: QuizResultQuestion): string {
    if (question.type === 'short-answer') {
      return 'fas fa-minus';
    }
    return question.isCorrect ? 'fas fa-check' : 'fas fa-times';
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
    return this.isUserSelectedOption(question, optionIndex) && question.isCorrect === true;
  }

  getBenarSalahOptionText(option: string): string {
    if (!option) return '';

    // Extract "Benar" dari "A. Benar" atau "B. Salah"
    const parts = option.split('. ');
    return parts.length > 1 ? parts[1] : option;
  }

  shouldShowIncorrectAnswer(question: QuizResultQuestion, optionIndex: number): boolean {
    return this.isUserSelectedOption(question, optionIndex) && question.isCorrect === false;
  }

  shouldShowNeutralOption(question: QuizResultQuestion, optionIndex: number): boolean {
    return !this.isUserSelectedOption(question, optionIndex);
  }

  isUserSelectedOption(question: QuizResultQuestion, optionIndex: number): boolean {
    if (question.type === 'multiple-choice') {
      // Untuk multiple choice, bandingkan index dengan userAnswer
      return optionIndex === question.userAnswer;
    } else if (question.type === 'benar-salah') {
      // Untuk benar_salah, bandingkan text option dengan userAnswer
      const optionText = this.getBenarSalahOptionText(question.options[optionIndex]);
      return optionText === question.userAnswer;
    }
    return false;
  }

  getOptionClass(question: QuizResultQuestion, optionIndex: number): string {
    if (question.type === 'short-answer') {
      return '';
    }

    // ✅ LOGIKA BARU: Hanya styling pada jawaban yang dipilih user
    if (this.isUserSelectedOption(question, optionIndex)) {
      // Jika user pilih option ini dan jawabannya benar -> hijau
      if (question.isCorrect === true) {
        return 'correct-answer';
      }
      // Jika user pilih option ini dan jawabannya salah -> merah
      else if (question.isCorrect === false) {
        return 'user-incorrect';
      }
    }

    // Sisanya tetap netral (tidak ada styling khusus)
    return '';
  }

  getOptionIndicatorClass(question: QuizResultQuestion, optionIndex: number): string {
    if (question.type === 'short-answer') {
      return 'neutral';
    }

    // ✅ LOGIKA BARU: Hanya tampilkan icon pada jawaban yang dipilih user
    if (this.isUserSelectedOption(question, optionIndex)) {
      // Jika user pilih option ini dan jawabannya benar -> check
      if (question.isCorrect === true) {
        return 'correct';
      }
      // Jika user pilih option ini dan jawabannya salah -> X
      else if (question.isCorrect === false) {
        return 'incorrect';
      }
    }

    // Sisanya netral (tidak ada icon)
    return 'neutral';
  }

  goBack(): void {
    this.router.navigate(['/siswa/materi/lihat-materi', this.materialId, 'kuis']);
  }

  goPredicate(): void {
    console.log('🎯 Navigating to learning history with context...');

    // Navigate dengan informasi konteks quiz yang baru selesai
    this.router.navigate(['/siswa/riwayat'], {
      queryParams: {
        from: 'quiz-result',
        materialId: this.materialId,
        score: this.quizResult.score,
        timestamp: new Date().toISOString()
      }
    }).then(success => {
      if (success) {
        console.log('✅ Successfully navigated to learning history with context');
      } else {
        console.error('❌ Failed to navigate to learning history');
      }
    }).catch(error => {
      console.error('❌ Error navigating to learning history:', error);
    });
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
