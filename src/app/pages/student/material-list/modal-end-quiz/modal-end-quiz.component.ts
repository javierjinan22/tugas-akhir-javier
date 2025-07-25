import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { faExclamation, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-modal-end-quiz',
  templateUrl: './modal-end-quiz.component.html',
  styleUrls: ['./modal-end-quiz.component.css']
})
export class ModalEndQuizComponent implements OnInit {

  faExclamationCircle = faExclamationCircle;
  faExclamation = faExclamation;
  quizId?: string | number;

  constructor(
    private activeModal: BsModalRef,
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  onCancelClicked(){
    this.activeModal.hide();
  }

  onSubmitClicked() {
    // First hide the modal
    this.activeModal.hide();
    
    // Then navigate to the quiz view
    this.router.navigate([`/siswa/materi/lihat-materi/${this.quizId}/kuis/hasil`]);
  }

}
