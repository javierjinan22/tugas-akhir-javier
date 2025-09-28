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
    this.debugLocalStorage(this.materialId!);

    if (!this.materialId || typeof this.materialId !== 'string') {
      console.error('Material ID not found or invalid');
      this.activeModal.hide();
      return;
    }

    const materialId: string = this.materialId;
    this.isSubmitting = true;

    let finalAnswers: any = null;
    let quizState: any = null;

    // Prioritas 1: Cek final_answers
    const savedFinalAnswers = localStorage.getItem(`quiz_${materialId}_final_answers`);
    if (savedFinalAnswers) {
      try {
        finalAnswers = JSON.parse(savedFinalAnswers);
        console.log('✅ Modal: Found final_answers:', finalAnswers);
      } catch (e) {
        console.error('❌ Error parsing final_answers:', e);
      }
    }

    // Prioritas 2: Cek state (untuk backward compatibility)
    const savedState = localStorage.getItem(`quiz_${materialId}_state`);
    if (savedState) {
      try {
        quizState = JSON.parse(savedState);
        console.log('✅ Modal: Found state:', quizState);
      } catch (e) {
        console.error('❌ Error parsing state:', e);
      }
    }

    if (!finalAnswers && (!quizState || !quizState.answers)) {
      console.error('❌ No quiz answers found');
      this.isSubmitting = false;
      this.activeModal.hide();
      this.router.navigate([`/siswa/materi/lihat-materi/${materialId}/kuis`]);
      return;
    }

    const quizStartTimeString = localStorage.getItem(`quiz_${materialId}_start_time`);
    if (!quizStartTimeString) {
      console.error('Quiz start time not found');
      this.isSubmitting = false;
      this.activeModal.hide();
      this.router.navigate([`/siswa/materi/lihat-materi/${materialId}/kuis`]);
      return;
    }

    const quizStartTime = new Date(quizStartTimeString);

    this.studentProgressService.getMateriDetailForViewing(materialId).subscribe({
      next: (response) => {
        if (response.success) {
          const questions = response.data.quiz.questions;

          console.log('🔍 Modal: Questions from API:', questions.map((q: any, i: number) => ({
            index: i,
            type: q.type,
            question: q.question?.substring(0, 50),
            correctAnswer: q.correct_answer
          })));

          // Gunakan final_answers jika ada, fallback ke state
          let answersToSubmit: any[];

          if (finalAnswers && finalAnswers.answers) {
            console.log('✅ Modal: Using final_answers as primary source');
            answersToSubmit = finalAnswers.answers;

            // Log final answers
            console.log('🔍 Modal: Final answers from localStorage:', finalAnswers.answers.map((a: any, i: number) => ({
              questionIndex: i,
              studentAnswer: a.student_answer,
              isEmpty: !a.student_answer
            })));

          } else {
            console.log('⚠️ Modal: Fallback to state answers');
            answersToSubmit = questions.map((q: any, index: number) => {
              const userAnswer = quizState.answers[index];
              let studentAnswer = '';

              console.log(`🔍 Modal: Processing question ${index} from state:`, {
                userAnswer,
                type: typeof userAnswer
              });

              if (q.type === 'pilihan_ganda') {
                if (typeof userAnswer === 'number' && userAnswer >= 0) {
                  studentAnswer = String.fromCharCode(65 + userAnswer);
                } else {
                  studentAnswer = '';
                }
              } else {
                studentAnswer = String(userAnswer || '');
              }

              return {
                question_index: index,
                student_answer: studentAnswer
              };
            });
          }

          console.log('🚀 Modal: Final payload before submit:', {
            materialId,
            answersCount: answersToSubmit.length,
            answers: answersToSubmit.map((a: any, i: number) => ({
              questionIndex: a.question_index || i,
              studentAnswer: a.student_answer,
              isEmpty: !a.student_answer
            })),
            fullAnswers: answersToSubmit
          });

          // ✅ SUBMIT ke API
          this.studentProgressService.submitQuizAttempt(materialId, answersToSubmit, quizStartTime).subscribe({
            next: (submitResponse) => {
              console.log('✅ Quiz submitted successfully:', submitResponse);

              // ✅ SIMPAN hasil ke localStorage untuk backup
              this.saveQuizResultWithCorrectFormat(questions, answersToSubmit, submitResponse, materialId);
              this.clearQuizState(materialId);

              this.isSubmitting = false;
              this.activeModal.hide();

              this.activeModal.onHidden?.subscribe(() => {
                this.viewQuizDetail(submitResponse, materialId);
              });
            },
            error: (error) => {
              console.error('❌ Error submitting quiz:', error);
              this.clearQuizState(materialId);
              this.isSubmitting = false;
              this.activeModal.hide();
              this.router.navigate([`/siswa/materi/lihat-materi/${materialId}/kuis`]);
            }
          });
        }
      }
    });
  }

  // Method debugLocalStorage dengan detail lebih lengkap
  private debugLocalStorage(materialId: string): void {
    console.log('🔍 Modal: Debugging localStorage for materialId:', materialId);

    const state = localStorage.getItem(`quiz_${materialId}_state`);

    if (state) {
      try {
        const parsedState = JSON.parse(state);
        console.log('📦 Modal: Parsed quiz state:', parsedState);

        // Cek setiap jawaban dalam state
        if (parsedState.answers) {
          parsedState.answers.forEach((answer: any, index: number) => {
            console.log(`📄 Modal: Answer ${index}:`, {
              value: answer,
              type: typeof answer,
              isNumber: typeof answer === 'number',
              isString: typeof answer === 'string',
              isZero: answer === 0,
              isNull: answer === null,
              isUndefined: answer === undefined,
              stringValue: String(answer),
              jsonStringify: JSON.stringify(answer)
            });
          });
        }

      } catch (e) {
        console.error('❌ Error parsing localStorage state:', e);
      }
    }

    // Check semua keys yang mengandung materialId
    const allKeys = Object.keys(localStorage).filter(key => key.includes(materialId));
    console.log('🗂️ Modal: All localStorage keys for this material:', allKeys);

    allKeys.forEach(key => {
      const value = localStorage.getItem(key);
      console.log(`📄 Modal: ${key}:`, value);
    });
  }

  // Method viewQuizDetail untuk menggunakan attempt_number
  private viewQuizDetail(submitResponse: any, materialId: string): void {
    console.log('Viewing quiz attempt details from modal:', submitResponse);

    // attempt_number untuk mencari attemptId
    const attemptNumber = submitResponse.data?.attempt_number;
    const completedAt = submitResponse.data?.completed_at;

    console.log('🔍 Using attempt_number to find attemptId:', {
      attemptNumber,
      completedAt
    });

    if (attemptNumber) {
      // delay sedikit lalu cari attempt berdasarkan attempt_number
      setTimeout(() => {
        this.findAttemptByNumber(materialId, attemptNumber, completedAt);
      }, 1000); // 1 detik delay untuk memastikan data sudah tersimpan di server
    } else {
      console.log('❌ No attempt_number found, fallback to localStorage');
      this.router.navigate([`/siswa/materi/lihat-materi/${materialId}/kuis/hasil`]);
    }
  }

  // Method untuk mencari attempt berdasarkan attempt_number
  private findAttemptByNumber(materialId: string, attemptNumber: number, completedAt: string): void {
    console.log('🔍 Modal: Finding attempt by number:', attemptNumber);

    this.studentProgressService.getMateriDetailForViewing(materialId).subscribe({
      next: (response) => {
        console.log('📊 Modal: Material detail response:', response);

        if (response.success && response.data.quiz.attempts && response.data.quiz.attempts.length > 0) {
          let targetAttempt = null;

          // Cari berdasarkan attempt_number exact match
          targetAttempt = response.data.quiz.attempts.find((attempt: any) =>
            attempt.attempt_number === attemptNumber
          );

          if (targetAttempt) {
            console.log('✅ Modal: Found attempt by attempt_number:', targetAttempt._id);
          } else {
            // ✅ STRATEGI 2: Cari berdasarkan completed_at yang paling mendekati (dalam 30 detik)
            console.log('⚠️ Modal: No exact attempt_number match, trying by completed_at...');

            if (completedAt) {
              const targetTime = new Date(completedAt).getTime();
              targetAttempt = response.data.quiz.attempts.find((attempt: any) => {
                if (attempt.completed_at) {
                  const attemptTime = new Date(attempt.completed_at).getTime();
                  const timeDiff = Math.abs(targetTime - attemptTime);
                  return timeDiff < 30000; // 30 detik tolerance
                }
                return false;
              });

              if (targetAttempt) {
                console.log('✅ Modal: Found attempt by completed_at:', targetAttempt._id);
              }
            }
          }

          // Fallback ke attempt terbaru
          if (!targetAttempt) {
            console.log('⚠️ Modal: No matching attempt found, using latest attempt...');
            targetAttempt = response.data.quiz.attempts[0];
          }

          const attemptId = targetAttempt?._id || targetAttempt?.attempt_id;

          if (attemptId) {
            console.log('✅ Modal: Navigating to attempt:', attemptId);
            this.navigateToAttemptDetail(materialId, attemptId);
          } else {
            console.log('❌ Modal: No attemptId found, fallback to localStorage');
            this.router.navigate([`/siswa/materi/lihat-materi/${materialId}/kuis/hasil`]);
          }
        } else {
          console.log('❌ Modal: No attempts found, fallback to localStorage');
          this.router.navigate([`/siswa/materi/lihat-materi/${materialId}/kuis/hasil`]);
        }
      },
      error: (error) => {
        console.error('❌ Modal: Error finding attempt:', error);
        // Fallback ke localStorage jika API error
        this.router.navigate([`/siswa/materi/lihat-materi/${materialId}/kuis/hasil`]);
      }
    });
  }

  // Method untuk navigasi ke detail attempt
  private navigateToAttemptDetail(materialId: string, attemptId: string): void {
    console.log('🔍 Modal: Navigating to attempt detail:', attemptId);

    this.router.navigate(
      [`/siswa/materi/lihat-materi/${materialId}/kuis/hasil`],
      {
        queryParams: {
          attemptId: attemptId
        }
      }
    );
  }

  private saveQuizResultWithCorrectFormat(questions: any[], answersToSubmit: any[], submitResponse: any, materialId: string): void {
    const score = submitResponse.data?.score || this.calculateLocalScore(questions, answersToSubmit);

    const quizResult = {
      quizId: this.quizId || 1,
      materialId: materialId,
      completedAt: submitResponse.data?.completed_at || new Date().toISOString(),
      totalQuestions: questions.length,
      score: score,
      questions: questions.map((q: any, index: number) => {
        // Ambil jawaban dari answersToSubmit
        const submittedAnswer = answersToSubmit.find((a: any) => a.question_index === index);
        const userAnswerLetter = submittedAnswer?.student_answer || '';

        console.log(`💾 Modal: Saving question ${index}:`, {
          question: q.question?.substring(0, 30),
          correctAnswer: q.correct_answer,
          userAnswerLetter: userAnswerLetter,
          submittedAnswer: submittedAnswer
        });

        let questionType: 'multiple-choice' | 'short-answer' | 'benar-salah';
        let correctAnswer: string | number;
        let formattedUserAnswer: string | number;
        let isCorrect: boolean | null = null;

        if (q.type === 'pilihan_ganda') {
          questionType = 'multiple-choice';
          correctAnswer = q.correct_answer.charCodeAt(0) - 65; // "A"->0

          // Convert letter ke index
          if (userAnswerLetter && userAnswerLetter.length > 0) {
            formattedUserAnswer = userAnswerLetter.charCodeAt(0) - 65; // "A"->0
          } else {
            formattedUserAnswer = -1;
          }

          isCorrect = userAnswerLetter === q.correct_answer;
        } else if (q.type === 'benar_salah') {
          questionType = 'benar-salah';
          correctAnswer = q.correct_answer;
          formattedUserAnswer = userAnswerLetter;
          isCorrect = formattedUserAnswer === correctAnswer;
        } else {
          questionType = 'short-answer';
          correctAnswer = q.correct_answer;
          formattedUserAnswer = userAnswerLetter;
          isCorrect = null;
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

    console.log('💾 Modal: Saving quiz result to localStorage:', {
      score: quizResult.score,
      questionsWithAnswers: quizResult.questions.filter(q => q.userAnswer !== -1 && q.userAnswer !== '').length
    });

    localStorage.setItem(`quiz_result_${materialId}`, JSON.stringify(quizResult));
  }


  // Method untuk calculate score local jika API tidak return score
  private calculateLocalScore(questions: any[], answersToSubmit: any[]): number {
    let correctAnswers = 0;
    let totalQuestions = 0;

    questions.forEach((q: any, index: number) => {
      if (q.type === 'pilihan_ganda' || q.type === 'benar_salah') {
        totalQuestions++;

        const submittedAnswer = answersToSubmit.find((a: any) => a.question_index === index);
        const userAnswerLetter = submittedAnswer?.student_answer || '';

        if (q.type === 'pilihan_ganda') {
          if (userAnswerLetter === q.correct_answer) {
            correctAnswers++;
          }
        } else if (q.type === 'benar_salah') {
          if (userAnswerLetter === q.correct_answer) {
            correctAnswers++;
          }
        }
      }
    });

    return totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  }

  private clearQuizState(materialId: string): void {
    console.log('🧹 Clearing quiz state from modal');
    localStorage.removeItem(`quiz_${materialId}_state`);
    localStorage.removeItem(`quiz_${materialId}_timer`);
    localStorage.removeItem(`quiz_${materialId}_start_time`);
  }
}
