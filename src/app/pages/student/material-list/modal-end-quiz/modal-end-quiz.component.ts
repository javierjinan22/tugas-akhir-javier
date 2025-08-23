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
  
  // ✅ TAMBAH: Properties untuk menangani submit
  isSubmitting: boolean = false;
  
  constructor(
    private activeModal: BsModalRef,
    private router: Router,
    private studentProgressService: StudentProgressService
  ) { }

  ngOnInit(): void {
  }

  onCancelClicked(){
    this.activeModal.hide();
  }

  onSubmitClicked() {
  if (!this.materialId || typeof this.materialId !== 'string') {
    console.error('Material ID not found or invalid');
    this.activeModal.hide();
    return;
  }

  const materialId: string = this.materialId;
  this.isSubmitting = true;

  // ✅ Ambil data quiz dari localStorage
  const savedState = localStorage.getItem(`quiz_${materialId}_state`);
  if (!savedState) {
    console.error('No quiz state found');
    this.activeModal.hide();
    this.router.navigate([`/siswa/materi/lihat-materi/${materialId}/kuis/hasil`]);
    return;
  }

  const quizState = JSON.parse(savedState);
  
  this.studentProgressService.getMateriDetailForViewing(materialId).subscribe({
    next: (response) => {
      if (response.success) {
        const questions = response.data.quiz.questions;
        
        const answers = questions.map((q: any, index: number) => {
          const userAnswer = quizState.answers[index];
          let studentAnswer = '';
          
          if (q.type === 'pilihan_ganda') {
            if (typeof userAnswer === 'number') {
              studentAnswer = String.fromCharCode(65 + userAnswer);
            } else if (typeof userAnswer === 'string') {
              studentAnswer = userAnswer;
            }
          } else {
            studentAnswer = String(userAnswer || '');
          }

          return {
            question_index: index,
            student_answer: studentAnswer
          };
        });

        console.log('🔍 Modal submitting answers:', answers);

        this.studentProgressService.submitQuizAttempt(materialId, answers).subscribe({
          next: (submitResponse) => {
            console.log('Quiz submitted from modal:', submitResponse);
            
            let score = 0;
            if (submitResponse.data?.score !== undefined) {
              score = submitResponse.data.score;
            } else {
              // Local calculation fallback
              let correctAnswers = 0;
              let totalQuestions = 0;
              
              questions.forEach((q: any, index: number) => {
                if (q.type === 'pilihan_ganda') {
                  totalQuestions++;
                  const userAnswer = quizState.answers[index];
                  const userAnswerLetter = typeof userAnswer === 'number' ? 
                    String.fromCharCode(65 + userAnswer) : userAnswer;
                  if (userAnswerLetter === q.correct_answer) {
                    correctAnswers++;
                  }
                }
              });
              
              score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
            }

            this.saveQuizResult(questions, quizState.answers, score, materialId);
            this.clearQuizState(materialId);
            
            this.isSubmitting = false;
            this.activeModal.hide();
            
            this.activeModal.onHidden?.subscribe(() => {
              this.router.navigate([`/siswa/materi/lihat-materi/${materialId}/kuis`])
                .then(() => {
                  window.location.reload(); 
                });
            });
          },
          error: (error) => {
            console.error('Error submitting quiz from modal:', error);
            this.clearQuizState(materialId);
            
            this.isSubmitting = false;
            this.activeModal.hide();
            
            this.router.navigate([`/siswa/materi/lihat-materi/${materialId}/kuis/hasil`]);
          }
        });
      } else {
        this.isSubmitting = false;
        this.activeModal.hide();
        console.error('Failed to load quiz data');
      }
    },
    error: (error) => {
      console.error('Error loading quiz data:', error);
      this.isSubmitting = false;
      this.activeModal.hide();
    }
  });
}

  // ✅ PERBAIKAN: Method untuk save quiz result dengan parameter materialId
  private saveQuizResult(questions: any[], answers: any[], score: number, materialId: string): void {
    const quizResult = {
      quizId: this.quizId,
      materialId: materialId,
      completedAt: new Date().toISOString(),
      totalQuestions: questions.length,
      score: score,
      questions: questions.map((q: any, index: number) => ({
        id: index,
        question: q.question,
        type: q.type === 'pilihan_ganda' ? 'multiple-choice' : 'short-answer',
        options: q.options || [],
        correctAnswer: q.type === 'pilihan_ganda' ? q.correct_answer : '',
        userAnswer: q.type === 'pilihan_ganda' ? 
          (typeof answers[index] === 'number' ? answers[index] : 
           (typeof answers[index] === 'string' ? answers[index].charCodeAt(0) - 65 : null)) : 
          answers[index],
        isCorrect: q.type === 'pilihan_ganda' ? 
          (typeof answers[index] === 'number' ? String.fromCharCode(65 + answers[index]) : answers[index]) === q.correct_answer : null
      }))
    };
    
    localStorage.setItem(`quiz_result_${materialId}`, JSON.stringify(quizResult));
  }

  // ✅ PERBAIKAN: Method untuk clear quiz state dengan parameter materialId
  private clearQuizState(materialId: string): void {
    localStorage.removeItem(`quiz_${materialId}_state`);
    localStorage.removeItem(`quiz_${materialId}_timer`);
  }
}
