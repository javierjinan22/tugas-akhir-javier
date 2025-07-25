import { Component, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { LoginModalComponent } from '../login-modal/login-modal.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/service/auth.service';


@Component({
  selector: 'app-teacher-registration-modal',
  templateUrl: './teacher-registration-modal.component.html',
  styleUrls: ['./teacher-registration-modal.component.css']
})
export class TeacherRegistrationModalComponent implements OnInit {

  registerForm!: FormGroup;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  passwordVisible = false;
  confirmPasswordVisible = false;
  loading = false;
  errorMsg = '';

  constructor(
    public activeModal: BsModalRef,
    private modalService: BsModalService,
    private fb: FormBuilder,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      nama_lengkap: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      password: ['', Validators.required],
      konfirmasi_password: ['', Validators.required],
      role: ['guru'],
      nuptk: ['', Validators.required],
      instansi: ['', Validators.required],
    });
  }

  onSubmitRegister() {
    if (this.registerForm.invalid) return;

    if (this.registerForm.value.password !== this.registerForm.value.konfirmasi_password) {
      this.errorMsg = "Password dan konfirmasi password tidak cocok!";
      return;
    }

    this.loading = true;
    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.loading = false;
        this.activeModal.hide();
        this.modalService.show(LoginModalComponent, { class: 'modal-dialog-centered' });
      },
      error: err => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Registrasi gagal. Cek input!';
      }
    });
  }
  
  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

}
