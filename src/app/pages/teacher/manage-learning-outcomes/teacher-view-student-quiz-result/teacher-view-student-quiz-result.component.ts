import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TeacherProgressService, StudentQuizResultResponse } from 'src/app/service/teacher-progress.service';

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
  studentId: string;
  completedAt: string;
  totalQuestions: number;
  score: number;
  questions: QuizResultQuestion[];
}

@Component({
  selector: 'app-teacher-view-student-quiz-result',
  templateUrl: './teacher-view-student-quiz-result.component.html',
  styleUrls: ['./teacher-view-student-quiz-result.component.css']
})
export class TeacherViewStudentQuizResultComponent implements OnInit, OnDestroy {

  classId: string = '';
  materiId: string = '';
  studentId: string = '';
  
  studentInfo: any = null;
  materiInfo: any = null;
  quizResult: QuizResult | null = null;
  
  loading: boolean = false;
  errorMsg: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teacherProgressService: TeacherProgressService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    // Get route parameters
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.classId = params['classId'];
      this.materiId = params['materiId'];
      this.studentId = params['studentId'];
      
      console.log('Route params:', {
        classId: this.classId,
        materiId: this.materiId,
        studentId: this.studentId
      });

      if (this.classId && this.materiId && this.studentId) {
        this.loadStudentQuizResult();
      } else {
        this.errorMsg = 'Parameter route tidak valid.';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ Load data dari backend
  loadStudentQuizResult(): void {
    this.loading = true;
    this.errorMsg = '';

    console.log('Loading student quiz result for:', {
      classId: this.classId,
      materiId: this.materiId,
      studentId: this.studentId
    });

    this.teacherProgressService.getStudentQuizResult(this.classId, this.materiId, this.studentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: StudentQuizResultResponse) => {
          console.log('✅ Student quiz result response:', response);
          
          if (response.success) {
            this.studentInfo = response.data.student_info;
            this.materiInfo = response.data.materi_info;
            this.buildQuizResultFromAPI(response.data.quiz_attempt);
          } else {
            this.errorMsg = response.message || 'Gagal memuat hasil quiz siswa.';
          }
          
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error loading student quiz result:', error);
          
          let errorMessage = 'Gagal memuat hasil quiz siswa. ';
          
          if (error.status === 401) {
            errorMessage += 'Sesi login telah berakhir.';
          } else if (error.status === 403) {
            errorMessage += 'Anda tidak memiliki akses.';
          } else if (error.status === 404) {
            errorMessage += 'Data tidak ditemukan.';
          } else if (error.status === 0) {
            errorMessage += 'Tidak dapat terhubung ke server.';
          } else {
            errorMessage += 'Silakan coba lagi.';
          }
          
          this.errorMsg = errorMessage;
          this.loading = false;
        }
      });
  }

  // ✅ Build quiz result dari API response
  buildQuizResultFromAPI(attempt: any): void {
    console.log('🔧 Building quiz result from API:', attempt);

    this.quizResult = {
      quizId: attempt.attempt_number || 1,
      materialId: this.materiId,
      studentId: this.studentId,
      completedAt: attempt.completed_at,
      totalQuestions: attempt.total_questions,
      score: attempt.score,
      questions: attempt.detailed_answers.map((answer: any) => {
        const originalQuestion = answer.question_data.question;
        const originalOptions = answer.question_data.options || [];

        console.log('🔍 Processing question:', {
          index: answer.question_index,
          type: answer.question_data.type,
          correctAnswer: answer.question_data.correct_answer,
          studentAnswer: answer.student_answer,
          isCorrect: answer.is_correct
        });

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

        return question;
      })
    };

    console.log('✅ Built complete quiz result:', {
      totalQuestions: this.quizResult.totalQuestions,
      score: this.quizResult.score,
      studentInfo: this.studentInfo,
      materiInfo: this.materiInfo
    });
  }

  // ✅ Sanitize HTML content
  sanitizeHtml(html: string): SafeHtml {
    if (!html) return this.sanitizer.bypassSecurityTrustHtml('');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  // ✅ Check if content has HTML
  hasHtmlContent(content: string): boolean {
    if (!content) return false;
    return content.includes('<img') || content.includes('<figure') || 
           content.includes('<p>') || content.includes('<div>') || 
           content.includes('<') || content.includes('base64');
  }

  // ✅ Strip HTML tags
  stripHtmlTags(text: string): string {
    if (!text) return '';
    const div = document.createElement('div');
    div.innerHTML = text;
    return div.textContent || div.innerText || '';
  }

  getCleanOption(option: string): string {
    return this.stripHtmlTags(option);
  }

  // ✅ Format date
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
    return date.toLocaleDateString('id-ID', options).replace(',', ' pukul');
  }

  // ✅ Question scoring methods
  getScoreBadgeClass(question: QuizResultQuestion): string {
    if (question.type === 'short-answer') return 'not-graded';
    return question.isCorrect ? 'correct' : 'incorrect';
  }

  getQuestionScore(question: QuizResultQuestion): string {
    if (question.type === 'short-answer') return '-';
    return question.isCorrect ? '1' : '0';
  }

  // ✅ Option styling methods
  getBenarSalahTextClass(option: string): string {
    const optionText = this.getBenarSalahOptionText(option);
    if (optionText === 'Benar') return 'text-benar';
    if (optionText === 'Salah') return 'text-salah';
    return '';
  }

  getBenarSalahOptionText(option: string): string {
    if (!option) return '';
    const parts = option.split('. ');
    return parts.length > 1 ? parts[1] : option;
  }

  getOptionClass(question: QuizResultQuestion, optionIndex: number): string {
    if (question.type === 'short-answer') return '';

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

    if (this.isCorrectOption(question, optionIndex)) return 'correct-answer';
    if (this.isIncorrectUserOption(question, optionIndex)) return 'user-incorrect';
    return '';
  }

  getOptionIndicatorClass(question: QuizResultQuestion, optionIndex: number): string {
    if (question.type === 'short-answer') return 'neutral';

    if (question.type === 'benar-salah') {
      const optionText = this.getBenarSalahOptionText(question.options[optionIndex]);
      if (optionText === question.correctAnswer && question.isCorrect === true) {
        return 'correct';
      }
      if (optionText === question.userAnswer && question.isCorrect === false) {
        return 'incorrect';
      }
      return 'neutral';
    }

    if (this.isCorrectOption(question, optionIndex)) return 'correct';
    if (this.isIncorrectUserOption(question, optionIndex)) return 'incorrect';
    return 'neutral';
  }

  isCorrectOption(question: QuizResultQuestion, optionIndex: number): boolean {
    if (question.type === 'benar-salah') {
      const optionText = this.getBenarSalahOptionText(question.options[optionIndex]);
      return optionText === question.correctAnswer && question.isCorrect === true;
    }
    return optionIndex === question.correctAnswer && question.isCorrect === true;
  }

  isIncorrectUserOption(question: QuizResultQuestion, optionIndex: number): boolean {
    if (question.type === 'benar-salah') {
      const optionText = this.getBenarSalahOptionText(question.options[optionIndex]);
      return optionText === question.userAnswer && question.isCorrect === false;
    }
    return optionIndex === question.userAnswer && question.isCorrect === false;
  }

  // ✅ Navigation methods
  goBack(): void {
    this.router.navigate([
      '/guru/hasil-belajar/detail-materi-belajar', 
      this.classId, 
      'materials', 
      this.materiId, 
      'students'
    ]);
  }

  refreshData(): void {
    this.loadStudentQuizResult();
  }

  // ✅ Get student name
  getStudentName(): string {
    return this.studentInfo?.nama_siswa || 'Siswa';
  }

  // ✅ Get material name
  getMaterialName(): string {
    return this.materiInfo?.judul_materi || 'Materi';
  }

  getLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D
  }

  getCorrectAnswersCount(): number {
    if (!this.quizResult) return 0;
    return this.quizResult.questions.filter(q => q.isCorrect === true).length;
  }

  getIncorrectAnswersCount(): number {
    if (!this.quizResult) return 0;
    return this.quizResult.questions.filter(q => q.isCorrect === false).length;
  }

  formatDateShort(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getOptionRowClass(question: QuizResultQuestion, optionIndex: number): string {
    if (question.type === 'short-answer') return '';

    if (this.isCorrectOption(question, optionIndex)) return 'correct-option';
    if (this.isIncorrectUserOption(question, optionIndex)) return 'incorrect-option';
    return '';
  }
}
