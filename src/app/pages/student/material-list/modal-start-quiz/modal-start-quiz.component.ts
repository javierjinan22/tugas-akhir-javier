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
  materialId?: string | number;

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
    this.router.navigate([`/siswa/materi/lihat-materi/${this.materialId}/kuis/kerjakan`]);
  }

}
