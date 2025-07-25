import { Component, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/service/auth.service';
import { SchoolService } from 'src/app/service/school.service';
import { ClassService } from 'src/app/service/class.service';
import { LoginModalComponent } from '../login-modal/login-modal.component';

@Component({
  selector: 'app-student-registration-modal',
  templateUrl: './student-registration-modal.component.html',
  styleUrls: ['./student-registration-modal.component.css']
})
export class StudentRegistrationModalComponent implements OnInit {

  registerForm!: FormGroup;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  passwordVisible = false;
  confirmPasswordVisible = false;
  loading = false;
  errorMsg = '';

  schools: any[] = [];
  classes: any[] = [];

  

  loadingSchools = false;
  loadingClasses = false;

  constructor(
    public activeModal: BsModalRef,
    private modalService: BsModalService,
    private fb: FormBuilder,
    private authService: AuthService,
    private schoolService: SchoolService,
    private classService: ClassService
  ) {}

  ngOnInit(): void {
    
    // Init form
    this.registerForm = this.fb.group({
      nama_lengkap: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', Validators.required],
      konfirmasi_password: ['', Validators.required],
      sekolah: ['', Validators.required], // value: school _id
      kelas: ['', Validators.required],    // value: class _id
    });

    // Ambil sekolah untuk dropdown
    this.loadingSchools = true;
    this.schoolService.getAllSchools().subscribe({
      next: (data: any) => {
        this.schools = data;
        this.loadingSchools = false;
      },
      error: () => {
        this.schools = [];
        this.loadingSchools = false;
      }
    });

    // Load kelas ketika sekolah dipilih
    this.registerForm.get('sekolah')!.valueChanges.subscribe((schoolId) => {
      if (schoolId) {
        this.loadingClasses = true;
        this.classService.getClassesBySchool(schoolId).subscribe({
          next: (data: any) => {
            this.classes = data;
            this.loadingClasses = false;
          },
          error: () => {
            this.classes = [];
            this.loadingClasses = false;
          }
        });
      } else {
        this.classes = [];
      }
    });
  }

  onSubmitRegister() {
    if (this.registerForm.invalid) return;
    if (this.registerForm.value.password !== this.registerForm.value.konfirmasi_password) {
      this.errorMsg = "Password dan konfirmasi password tidak cocok!";
      return;
    }

    this.loading = true;
    const payload = {
      nama_lengkap: this.registerForm.value.nama_lengkap,
      username: this.registerForm.value.username,
      password: this.registerForm.value.password,
      konfirmasi_password: this.registerForm.value.konfirmasi_password,
      role: 'siswa',
      sekolah: this.registerForm.value.sekolah, // ID sekolah
      kelas: this.registerForm.value.kelas     // ID kelas
    };
    this.authService.register(payload).subscribe({
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
