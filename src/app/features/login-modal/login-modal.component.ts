import { Component, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/service/auth.service';
import { ClassService } from 'src/app/service/class.service';
import { SelectRoleModalComponent } from '../select-role-modal/select-role-modal.component';
import { Router } from '@angular/router';
import { SchoolService, School, SchoolClass } from 'src/app/service/school.service';
import { InputNpsnModalComponent } from '../input-npsn-modal/input-npsn-modal.component';
import { ClassConnectionModalComponent } from '../class-connection-modal/class-connection-modal.component';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'; // ✅ TAMBAH: Import eye icons

@Component({
  selector: 'app-login-modal',
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.css']
})
export class LoginModalComponent implements OnInit {

  loginForm!: FormGroup;
  bsModalRef: any;
  errorMsg: string = '';
  isSubmitting = false; 

  // ✅ TAMBAH: Properties untuk success message dan prefilled username
  successMessage?: string;
  prefilledUsername?: string;

  // ✅ TAMBAH: Eye icon properties
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  passwordVisible = false;

  // ✅ TAMBAH: Toast properties
  showToast = false;
  toastMessage = '';
  toastClass = '';
  toastIcon = '';
  private toastTimeout?: number;

  constructor(
    public activeModal: BsModalRef,
    private modalService: BsModalService,
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private schoolService: SchoolService,
    private classService: ClassService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: [this.prefilledUsername || '', Validators.required], // ✅ Use prefilled username
      password: ['', Validators.required]
    });

    // ✅ Show success message if provided
    if (this.successMessage) {
      this.showSuccessToast(this.successMessage);
      // ✅ TAMBAH: Clear success message after showing it
      setTimeout(() => {
        this.successMessage = '';
      }, 100);
    }
  }

  // ✅ TAMBAH: Toggle password visibility function
  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.showErrorToast('Mohon lengkapi username dan password');
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMsg = '';
    
    this.showInfoToast('Sedang memproses login...');

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        if (res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('role', res.role);
          
          if (res.user) {
            localStorage.setItem('userId', res.user._id || res.user.id);
          }

          const userName = res.user?.nama || res.user?.username || 'User';
          this.showSuccessToast(`Selamat datang, ${userName}!`);

          setTimeout(() => {
            this.isSubmitting = false;
            this.activeModal.hide();
            
            if (res.role === 'guru') {
              this.handleTeacherLogin();
            } else if (res.role === 'siswa') {
              this.handleStudentLogin();
            }
          }, 2000); 
        }
      },
      error: (err) => {
        console.error('Login failed:', err);
        this.isSubmitting = false;
        
        // Specific error toast
        if (err.status === 401) {
          this.showErrorToast('Username atau password salah');
        } else if (err.status === 400) {
          this.showErrorToast('Data login tidak valid');
        } else if (err.status === 0) {
          this.showErrorToast('Tidak dapat terhubung ke server');
        } else {
          this.showErrorToast('Terjadi kesalahan. Silakan coba lagi.');
        }
        
        // Tetap set errorMsg sebagai fallback
        this.errorMsg = err?.error?.message || 'Login gagal, cek username atau password.';
      }
    });
  }

  // Method untuk mark form as touched
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private handleTeacherLogin() {
    this.schoolService.getMySchool().subscribe({
      next: (school: School) => {
        console.log('✅ Teacher school data:', school);

        if (school && school._id) {
          localStorage.setItem('schoolId', school._id);
          this.checkSchoolClasses(school);
        } else {
          this.showInputNpsnModal();
        }
      },
      error: (err) => {
        console.error('❌ Error getting school:', err);

        if (err.status === 404) {
          this.showInputNpsnModal();
        } else {
          // ✅ Error toast untuk guru
          this.showErrorToast('Gagal mengambil data sekolah');
        }
      }
    });
  }

  private handleStudentLogin() {
    this.authService.getProfile().subscribe({
      next: (profileRes) => {
        console.log('✅ Student profile:', profileRes);
        
        if (profileRes.success && profileRes.data) {
          // Simpan info sekolah dan kelas di localStorage
          if (profileRes.data.sekolah) {
            localStorage.setItem('schoolId', profileRes.data.sekolah.id);
            localStorage.setItem('schoolName', profileRes.data.sekolah.nama);
          }
          if (profileRes.data.kelas) {
            localStorage.setItem('classId', profileRes.data.kelas.id);
            localStorage.setItem('className', profileRes.data.kelas.nama_kelas);
          }
        }
        
        // ✅ Redirect ke dashboard siswa
        this.router.navigate(['/siswa/dashboard']);
      },
      error: (err) => {
        console.error('❌ Error getProfile:', err);
        
        // ✅ Warning toast untuk siswa
        this.showErrorToast('Gagal memuat profil. Melanjutkan ke dashboard...');
        
        // Tetap redirect, bisa tampilkan pesan error jika perlu
        setTimeout(() => {
          this.router.navigate(['/siswa/dashboard']);
        }, 2000);
      }
    });
  }

  private checkSchoolClasses(school: School) {
    // Cek kelas dari response getMySchool (tidak perlu API call terpisah)
    const classes: SchoolClass[] = school.kelas || [];
    
    // Filter hanya kelas yang aktif
    const activeClasses = classes.filter((cls: SchoolClass) => cls.flag_aktif === 1);

    if (activeClasses.length > 0) {
      // Sekolah punya kelas aktif - lanjut ke dashboard
      this.router.navigate(['/guru/dashboard']);
    } else {
      // Sekolah belum punya kelas aktif - show class creation modal
      this.showClassConnectionModal(school);
    }
  }

  private showInputNpsnModal() {
    this.bsModalRef = this.modalService.show(InputNpsnModalComponent, {
      class: 'modal-dialog-centered modal-md',
      backdrop: 'static', 
      keyboard: false 
    });

    // Listen ketika NPSN modal ditutup
    this.bsModalRef.onHide?.subscribe(() => {
      
      setTimeout(() => {
        // Cek lagi apakah sekolah sudah di-claim
        this.schoolService.getMySchool().subscribe({
          next: (school: School) => {
            // Sekolah berhasil di-claim, cek kelas
            this.checkSchoolClasses(school);
          },
          error: (err) => {
              console.error('Still no school after NPSN modal');
          }
        });
      }, 500);
    });
  }

  private showClassConnectionModal(school: School) {
    
    const initialState = {
      school: school,
      isMandatory: true, 
      isFromLogin: true 
    };

    this.bsModalRef = this.modalService.show(ClassConnectionModalComponent, {
      class: 'modal-dialog-centered modal-lg',
      initialState,
      backdrop: 'static', 
      keyboard: false 
    });

    this.bsModalRef.onHide?.subscribe(() => {
      
      setTimeout(() => {
        // Verify that at least one class was created before redirecting
        this.schoolService.getMySchool().subscribe({
          next: (updatedSchool: School) => {
            const activeClasses = updatedSchool.kelas?.filter(cls => cls.flag_aktif === 1) || [];
            
            if (activeClasses.length > 0) {
              this.router.navigate(['/guru/dashboard']);
            } else {
              // If no classes were created, show the modal again
              this.showClassConnectionModal(school);
            }
          },
          error: (err) => {
            console.error('❌ Error verifying classes:', err);
            // In case of error, show modal again
            this.showClassConnectionModal(school);
          }
        });
      }, 500);
    });
  }

  // ✅ PERTAHANKAN: Function untuk ke select-role-modal (TIDAK DIHILANGKAN)
  onButtonRegistrationClicked(){
    this.activeModal.hide();
    this.bsModalRef = this.modalService.show(SelectRoleModalComponent, {
      class: 'modal-dialog-centered modal-md'
    });
  }

  // ✅ Toast methods (sama seperti sebelumnya)
  private showSuccessToast(message: string): void {
    this.hideToast(); // Clear any existing toast
    setTimeout(() => {
      this.toastMessage = message;
      this.toastClass = 'toast-success';
      this.toastIcon = 'fas fa-check-circle';
      this.showToast = true;

      this.toastTimeout = window.setTimeout(() => {
        this.hideToast();
      }, 3000);
    }, 100);
  }

  private showErrorToast(message: string): void {
    this.hideToast(); // Clear any existing toast
    setTimeout(() => {
      this.toastMessage = message;
      this.toastClass = 'toast-error';
      this.toastIcon = 'fas fa-exclamation-circle';
      this.showToast = true;

      this.toastTimeout = window.setTimeout(() => {
        this.hideToast();
      }, 4000);
    }, 100);
  }

  private showInfoToast(message: string): void {
    this.hideToast(); 
    setTimeout(() => {
      this.toastMessage = message;
      this.toastClass = 'toast-info';
      this.toastIcon = 'fas fa-info-circle';
      this.showToast = true;

      this.toastTimeout = window.setTimeout(() => {
        this.hideToast();
      }, 3000);
    }, 100);
  }

  hideToast(): void {
    this.showToast = false;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  ngOnDestroy(): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }
}