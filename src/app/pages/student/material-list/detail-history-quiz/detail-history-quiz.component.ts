import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

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
    questions: [
      {
        id: 1,
        question: 'Bagaimana sikap yang benar saat mengomentari postingan teman di internet?',
        type: 'multiple-choice',
        options: [
          'Menggunakan kata-kata kasar agar teman merasa malu',
          'Memberikan komentar yang sopan dan membangun',
          'Menghina teman karena pendapatnya berbeda',
          'Tidak peduli dan mengabaikan teman'
        ],
        correctAnswer: 1,
        userAnswer: 1,
        isCorrect: true
      },
      {
        id: 2,
        question: 'Bagaimana sikap yang benar saat mengomentari postingan teman di internet?',
        type: 'multiple-choice',
        options: [
          'Menggunakan kata-kata kasar agar teman merasa malu',
          'Memberikan komentar yang sopan dan membangun',
          'Menghina teman karena pendapatnya berbeda',
          'Tidak peduli dan mengabaikan teman'
        ],
        correctAnswer: 1,
        userAnswer: 0,
        isCorrect: false
      },
      {
        id: 3,
        question: 'Bagaimana sikap yang benar saat mengomentari postingan teman di internet?',
        type: 'multiple-choice',
        options: [
          'Menggunakan kata-kata kasar agar teman merasa malu',
          'Memberikan komentar yang sopan dan membangun',
          'Menghina teman karena pendapatnya berbeda',
          'Tidak peduli dan mengabaikan teman'
        ],
        correctAnswer: 1,
        userAnswer: 1,
        isCorrect: true
      },
      {
        id: 4,
        question: 'Jelaskan bagaimana cara anda menjaga privasi saat menggunakan media sosial?',
        type: 'short-answer',
        options: [],
        correctAnswer: '',
        userAnswer: 'Saya akan menjaga privasi dengan tidak membagikan informasi pribadi seperti alamat dan nomor telepon kepada orang yang tidak dikenal.',
        isCorrect: null
      },
      {
        id: 5,
        question: 'Apa yang dimaksud dengan etika digital?',
        type: 'multiple-choice',
        options: [
          'Cara menggunakan gadget',
          'Aturan penggunaan internet yang baik dan benar',
          'Hukum tentang internet',
          'Cara menginstal aplikasi'
        ],
        correctAnswer: 1,
        userAnswer: 1,
        isCorrect: true
      }
    ]
  };

  materialId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.materialId = params['id'] || '1';
      this.loadQuizResult();
    });
  }

  loadQuizResult(): void {
    // Try to load from localStorage first
    const savedResult = localStorage.getItem(`quiz_result_${this.materialId}`);
    
    if (savedResult) {
      this.quizResult = JSON.parse(savedResult);
    }
    // If no saved result, use mock data (already initialized above)
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

  getOptionClass(question: QuizResultQuestion, optionIndex: number): string {
    if (optionIndex === question.correctAnswer) {
      return 'correct-answer';
    }
    if (optionIndex === question.userAnswer && !question.isCorrect) {
      return 'user-incorrect';
    }
    return '';
  }

  getOptionIndicatorClass(question: QuizResultQuestion, optionIndex: number): string {
    if (optionIndex === question.correctAnswer) {
      return 'correct';
    }
    if (optionIndex === question.userAnswer && !question.isCorrect) {
      return 'incorrect';
    }
    return 'neutral';
  }

  isCorrectOption(question: QuizResultQuestion, optionIndex: number): boolean {
    return optionIndex === question.correctAnswer;
  }

  isIncorrectUserOption(question: QuizResultQuestion, optionIndex: number): boolean {
    return optionIndex === question.userAnswer && !question.isCorrect;
  }

  goBack(): void {
    this.router.navigate(['/siswa/materi/lihat-materi', this.materialId, 'kuis']);
  }

  goPredicate() {
    
  }
}
