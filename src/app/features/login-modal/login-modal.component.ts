import { Component, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { SelectRoleModalComponent } from '../select-role-modal/select-role-modal.component';

@Component({
  selector: 'app-login-modal',
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.css']
})
export class LoginModalComponent implements OnInit {

  email = '';
  password = '';

  bsModalRef: any;

  constructor(
    public activeModal: BsModalRef,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
  }

  onSubmitLogin() {
    console.log('Login data:', this.email, this.password);

    this.activeModal.hide();
  }

  onButtonRegistrationClicked(){
    this.activeModal.hide();
    this.bsModalRef = this.modalService.show(SelectRoleModalComponent, {
      class: 'modal-dialog-centered modal-md' // Bootstrap class: modal di tengah & ukuran medium
    });
  }
  
}
