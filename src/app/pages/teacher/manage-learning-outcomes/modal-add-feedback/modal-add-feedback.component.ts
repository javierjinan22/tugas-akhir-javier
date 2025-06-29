import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { faExclamation } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-modal-add-feedback',
  templateUrl: './modal-add-feedback.component.html',
  styleUrls: ['./modal-add-feedback.component.css']
})
export class ModalAddFeedbackComponent implements OnInit {

  faExclamationCircle = faExclamationCircle;
  faExclamation = faExclamation;
  feedback: string = '';
  public siswa: any; // Assuming siswa is passed from the parent component
  

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
