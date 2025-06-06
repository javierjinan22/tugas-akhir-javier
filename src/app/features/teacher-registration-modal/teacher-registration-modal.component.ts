import { Component, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { InputNpsnModalComponent } from '../input-npsn-modal/input-npsn-modal.component';


@Component({
  selector: 'app-teacher-registration-modal',
  templateUrl: './teacher-registration-modal.component.html',
  styleUrls: ['./teacher-registration-modal.component.css']
})
export class TeacherRegistrationModalComponent implements OnInit {

  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  nuptk = '';
  instansi = '';

  faEye = faEye;
  faEyeSlash = faEyeSlash;
  passwordVisible: boolean = false;
  confirmPasswordVisible: boolean = false;

  constructor(
    public activeModal: BsModalRef,
    public modalService: BsModalService // besok diganti
  ) { }

  ngOnInit(): void {
  }

  onSubmitRegister() {
    console.log('Data pendaftaran guru:', this.fullName, this.email, this.password, this.confirmPassword, this.nuptk, this.instansi);

    // Close modal setelah submit
    this.activeModal.hide();
    this.modalService.show(InputNpsnModalComponent, {
        class: 'modal-dialog-centered'
      });
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

}
