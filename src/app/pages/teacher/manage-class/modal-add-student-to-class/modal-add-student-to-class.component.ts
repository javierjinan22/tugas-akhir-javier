import { Component, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { faExclamation } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-modal-add-student-to-class',
  templateUrl: './modal-add-student-to-class.component.html',
  styleUrls: ['./modal-add-student-to-class.component.css']
})
export class ModalAddStudentToClassComponent implements OnInit {

  faExclamationCircle = faExclamationCircle;
  faExclamation = faExclamation;
  public student: any;
  public class: any;

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
