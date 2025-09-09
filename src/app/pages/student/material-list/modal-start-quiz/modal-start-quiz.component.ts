import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { faExclamation, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-modal-start-quiz',
  templateUrl: './modal-start-quiz.component.html',
  styleUrls: ['./modal-start-quiz.component.css']
})
export class ModalStartQuizComponent implements OnInit {

  faExclamationCircle = faExclamationCircle;
  faExclamation = faExclamation;
  materialId?: string;
  materialTitle?: string;
  waktuPengerjaan?: number;
  totalQuestions?: number;

  constructor(
    private activeModal: BsModalRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Data sudah di-inject melalui initialState
  }

  onCancelClicked() {
    this.activeModal.hide();
  }

  onSubmitClicked() {
    if (this.materialId) {
      // Clear quiz state
      localStorage.removeItem(`quiz_${this.materialId}_state`);

      // Clear timer state
      localStorage.removeItem(`quiz_${this.materialId}_timer`);

      // Clear result (jika ada)
      localStorage.removeItem(`quiz_result_${this.materialId}`);

      // Clear any potential temporary states
      localStorage.removeItem(`quiz_${this.materialId}_final_answers`);

    }

    // First hide the modal
    this.activeModal.hide();

    // Then navigate to the quiz view
    this.router.navigate([`/siswa/materi/lihat-materi/${this.materialId}/kuis/kerjakan`]);
  }
}
