import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { faExclamation, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { StudentProgressService } from '../../../../service/student-progress.service';

@Component({
  selector: 'app-modal-end-quiz',
  templateUrl: './modal-end-quiz.component.html',
  styleUrls: ['./modal-end-quiz.component.css']
})
export class ModalEndQuizComponent implements OnInit {

  faExclamationCircle = faExclamationCircle;
  faExclamation = faExclamation;
  quizId?: string | number;
  materialId?: string;
  isSubmitting: boolean = false;

  constructor(
    private activeModal: BsModalRef,
    private router: Router,
    private studentProgressService: StudentProgressService
  ) { }

  ngOnInit(): void {
  }

  onCancelClicked(): void {
    this.activeModal.hide();
  }

  onSubmitClicked(): void {
  if (!this.materialId || typeof this.materialId !== 'string') {
    console.error('Material ID not found or invalid');
    this.activeModal.hide();
    return;
  }

  const materialId: string = this.materialId;
  this.isSubmitting = true;

  const savedState = localStorage.getItem(`quiz_${materialId}_state`);
  if (!savedState) {
    console.error('No quiz state found');
    this.isSubmitting = false;
    this.activeModal.hide();
    this.router.navigate([`/siswa/materi/lihat-materi/${materialId}/kuis`]);
    return;
  }

  const quizState = JSON.parse(savedState);
  
  this.studentProgressService.getMateriDetailForViewing(materialId).subscribe({
    next: (response) => {
      if (response.success) {
        const questions = response.data.quiz.questions;
        
        // ✅ Format answers sesuai backend
        const answers = questions.map((q: any, index: number) => {
          const userAnswer = quizState.answers[index];
          let studentAnswer = '';
          
          if (q.type === 'pilihan_ganda') {
            if (typeof userAnswer === 'number') {
              studentAnswer = String.fromCharCode(65 + userAnswer);
            } else if (typeof userAnswer === 'string') {
              studentAnswer = userAnswer;
            }
          } else if (q.type === 'benar_salah') {
            // ✅ TAMBAH: Handle benar_salah
            studentAnswer = String(userAnswer || '');
          } else {
            studentAnswer = String(userAnswer || '');
          }

          return {
            question_index: index,
            student_answer: studentAnswer
          };
        });

        console.log('🔍 Modal submitting answers (FINAL):', answers);

        this.studentProgressService.submitQuizAttempt(materialId, answers).subscribe({
          next: (submitResponse) => {
            console.log('✅ Quiz submitted successfully from modal:', submitResponse);
            
            // ✅ PERBAIKAN: Simpan hasil dengan format yang benar
            this.saveQuizResultWithCorrectFormat(questions, quizState.answers, submitResponse, materialId);
            this.clearQuizState(materialId);
            
            this.isSubmitting = false;
            this.activeModal.hide();
            
            // ✅ PERBAIKAN: Navigate tanpa reload
            this.activeModal.onHidden?.subscribe(() => {
              console.log('📍 Navigating to results...');
              this.router.navigate([`/siswa/materi/lihat-materi/${materialId}/kuis/hasil`]);
            });
          },
          error: (error) => {
            console.error('❌ Error submitting quiz from modal:', error);
            this.clearQuizState(materialId);
            this.isSubmitting = false;
            this.activeModal.hide();
            this.router.navigate([`/siswa/materi/lihat-materi/${materialId}/kuis`]);
          }
        });
      } else {
        this.isSubmitting = false;
        this.activeModal.hide();
        console.error('Failed to load quiz data for submission');
        this.router.navigate([`/siswa/materi/lihat-materi/${materialId}/kuis`]);
      }
    },
    error: (error) => {
      console.error('❌ Error loading quiz data for submission:', error);
      this.isSubmitting = false;
      this.activeModal.hide();
      this.router.navigate([`/siswa/materi/lihat-materi/${materialId}/kuis`]);
    }
  });
}

private saveQuizResultWithCorrectFormat(questions: any[], answers: any[], submitResponse: any, materialId: string): void {
  const score = submitResponse.data?.score || this.calculateLocalScore(questions, answers);
  
  const quizResult = {
    quizId: this.quizId || 1,
    materialId: materialId,
    completedAt: new Date().toISOString(),
    totalQuestions: questions.length,
    score: score,
    questions: questions.map((q: any, index: number) => {
      const userAnswer = answers[index];
      
      // ✅ PERBAIKAN: Handle semua tipe soal dengan benar
      let questionType: 'multiple-choice' | 'short-answer' | 'benar-salah';
      let correctAnswer: string | number;
      let formattedUserAnswer: string | number;
      let isCorrect: boolean | null = null;
      
      if (q.type === 'pilihan_ganda') {
        questionType = 'multiple-choice';
        // Simpan correctAnswer sebagai index (0,1,2,3)
        correctAnswer = q.correct_answer.charCodeAt(0) - 65;
        // Simpan userAnswer sebagai index
        formattedUserAnswer = typeof userAnswer === 'number' ? userAnswer : 
          (typeof userAnswer === 'string' && userAnswer ? userAnswer.charCodeAt(0) - 65 : -1);
        // Calculate isCorrect
        const userAnswerLetter = typeof userAnswer === 'number' ? 
          String.fromCharCode(65 + userAnswer) : userAnswer;
        isCorrect = userAnswerLetter === q.correct_answer;
      } else if (q.type === 'benar_salah') {
        questionType = 'benar-salah';
        // Simpan sebagai string "Benar" atau "Salah"
        correctAnswer = q.correct_answer;
        formattedUserAnswer = String(userAnswer || '');
        isCorrect = formattedUserAnswer === correctAnswer;
      } else {
        questionType = 'short-answer';
        correctAnswer = q.correct_answer;
        formattedUserAnswer = String(userAnswer || '');
        isCorrect = null; // Manual grading
      }

      return {
        id: index + 1,
        question: q.question,
        type: questionType,
        options: q.options || [],
        correctAnswer: correctAnswer,
        userAnswer: formattedUserAnswer,
        isCorrect: isCorrect
      };
    })
  };
  
  console.log('💾 Saving corrected quiz result from modal:', quizResult);
  localStorage.setItem(`quiz_result_${materialId}`, JSON.stringify(quizResult));
}

// ✅ TAMBAH: Method untuk calculate score local jika API tidak return score
private calculateLocalScore(questions: any[], answers: any[]): number {
  let correctAnswers = 0;
  let totalQuestions = 0;
  
  questions.forEach((q: any, index: number) => {
    if (q.type === 'pilihan_ganda' || q.type === 'benar_salah') {
      totalQuestions++;
      const userAnswer = answers[index];
      
      if (q.type === 'pilihan_ganda') {
        const userAnswerLetter = typeof userAnswer === 'number' ? 
          String.fromCharCode(65 + userAnswer) : userAnswer;
        if (userAnswerLetter === q.correct_answer) {
          correctAnswers++;
        }
      } else if (q.type === 'benar_salah') {
        if (String(userAnswer) === q.correct_answer) {
          correctAnswers++;
        }
      }
    }
  });
  
  return totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
}

  // ✅ EXISTING: Method untuk clear quiz state (tetap sama)
  private clearQuizState(materialId: string): void {
    console.log('🧹 Clearing quiz state from modal');
    localStorage.removeItem(`quiz_${materialId}_state`);
    localStorage.removeItem(`quiz_${materialId}_timer`);
  }
}
