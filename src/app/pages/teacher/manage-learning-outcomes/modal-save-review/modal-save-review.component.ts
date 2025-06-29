import { Component, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { faExclamation } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-modal-save-review',
  templateUrl: './modal-save-review.component.html',
  styleUrls: ['./modal-save-review.component.css']
})
export class ModalSaveReviewComponent implements OnInit {

  faExclamationCircle = faExclamationCircle;
  faExclamation = faExclamation;

  constructor(
    public activeModal: BsModalRef,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
  }

  onCancelClicked(){
    this.activeModal.hide();
  }

  onSubmitClicked(){

  }
}
