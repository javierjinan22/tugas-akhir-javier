import { Component, OnInit, OnDestroy } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/service/auth.service';
import { SchoolService } from 'src/app/service/school.service';
import { ClassService } from 'src/app/service/class.service';
import { ValidationService } from 'src/app/service/validation.service';
import { CustomValidators } from 'src/app/validators/custom-validators';
import { LoginModalComponent } from '../login-modal/login-modal.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-student-registration-modal',
  templateUrl: './student-registration-modal.component.html',
  styleUrls: ['./student-registration-modal.component.css']
})
export class StudentRegistrationModalComponent implements OnInit, OnDestroy {

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

  // ✅ Toast properties
  showToast = false;
  toastMessage = '';
  toastClass = '';
  toastIcon = '';
  private toastTimeout?: number;

  // ✅ Validation properties
  usernameError = '';
  usernameSuggestions: string[] = [];
  validationDataLoaded = false;
  private subscriptions: Subscription[] = [];

  constructor(
    public activeModal: BsModalRef,
    private modalService: BsModalService,
    private fb: FormBuilder,
    private authService: AuthService,
    private schoolService: SchoolService,
    private classService: ClassService,
    private validationService: ValidationService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      nama_lengkap: ['', [Validators.required, CustomValidators.fullName()]],
      username: ['', [Validators.required, CustomValidators.username()]],
      password: ['', [Validators.required, CustomValidators.password()]],
      konfirmasi_password: ['', Validators.required],
      sekolah: ['', Validators.required],
      kelas: ['', Validators.required],
    }, {
      validators: CustomValidators.passwordMatch('password', 'konfirmasi_password')
    });

    this.loadSchools();

    const schoolSub = this.registerForm.get('sekolah')!.valueChanges.subscribe((schoolId) => {
      this.registerForm.patchValue({ kelas: '' });
      this.classes = [];
      
      if (schoolId) {
        this.loadClassesBySchool(schoolId);
      }
    });
    this.subscriptions.push(schoolSub);

    const usernameSub = this.registerForm.get('username')!.valueChanges
      .pipe(
        debounceTime(100),
        distinctUntilChanged()
      )
      .subscribe((username) => {
        if (this.validationDataLoaded) {
          this.validateUsername(username);
        }
      });
    this.subscriptions.push(usernameSub);

    const validationSub = this.validationService.isDataLoaded.subscribe((loaded) => {
      this.validationDataLoaded = loaded;
      if (loaded && this.registerForm.get('username')?.value) {
        this.validateUsername(this.registerForm.get('username')?.value);
      }
    });
    this.subscriptions.push(validationSub);
  }

  private validateUsername(username: string): void {
    this.usernameError = '';
    this.usernameSuggestions = [];

    if (!username || username.trim() === '') {
      return;
    }

    const usernameControl = this.registerForm.get('username');
    if (usernameControl?.errors && !usernameControl.errors['usernameTaken']) {
      return; // Don't check duplication if basic validation fails
    }

    // Check if username is taken
    if (this.validationService.isUsernameTaken(username)) {
      this.usernameError = 'Username sudah digunakan';
      this.usernameSuggestions = this.validationService.getUsernameSuggestions(username);
      
      // Set custom error
      usernameControl?.setErrors({ 
        ...usernameControl.errors, 
        usernameTaken: { message: 'Username sudah digunakan' }
      });
    } else {
      // Remove usernameTaken error if exists
      if (usernameControl?.errors) {
        delete usernameControl.errors['usernameTaken'];
        if (Object.keys(usernameControl.errors).length === 0) {
          usernameControl.setErrors(null);
        }
      }
    }
  }

  // ✅ Method untuk use suggested username
  useSuggestedUsername(suggestion: string): void {
    this.registerForm.patchValue({ username: suggestion });
    this.usernameError = '';
    this.usernameSuggestions = [];
  }

  // ✅ Method untuk get first error message
  getFirstErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    if (!control || !control.errors || !control.touched) return '';
    
    return CustomValidators.getFirstErrorMessage(control, controlName);
  }

  private loadSchools() {
    this.loadingSchools = true;
    this.showInfoToast('Memuat daftar sekolah...');
    
    this.schoolService.getAllSchools().subscribe({
      next: (response: any) => {
        console.log('🏫 Schools response:', response);
        
        if (response && Array.isArray(response)) {
          this.schools = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          this.schools = response.data;
        } else if (response && response.success && Array.isArray(response.schools)) {
          this.schools = response.schools;
        } else {
          this.schools = [];
        }
        
        this.loadingSchools = false;
        this.hideToast();
        
        if (this.schools.length === 0) {
          this.showErrorToast('Tidak ada data sekolah tersedia');
        }
      },
      error: (error) => {
        console.error('❌ Error loading schools:', error);
        this.schools = [];
        this.loadingSchools = false;
        this.showErrorToast('Gagal memuat daftar sekolah');
      }
    });
  }

  private loadClassesBySchool(schoolId: string) {
    console.log('📚 Loading classes for school:', schoolId);
    
    this.loadingClasses = true;
    this.showInfoToast('Memuat daftar kelas...');
    
    this.classService.getClassesBySchool(schoolId).subscribe({
      next: (response: any) => {
        console.log('📚 Classes response:', response);
        
        if (response && response.success && Array.isArray(response.data)) {
          this.classes = response.data.filter((cls: any) => cls.flag_aktif === 1);
        } else if (response && Array.isArray(response)) {
          this.classes = response.filter((cls: any) => cls.flag_aktif === 1);
        } else {
          this.classes = [];
        }
        
        this.loadingClasses = false;
        this.hideToast();
        
        console.log('📚 Filtered active classes:', this.classes);
        
        if (this.classes.length === 0) {
          this.showErrorToast('Sekolah ini belum memiliki kelas aktif');
        } else {
          this.showSuccessToast(`Ditemukan ${this.classes.length} kelas aktif`);
        }
      },
      error: (error) => {
        console.error('❌ Error loading classes:', error);
        this.classes = [];
        this.loadingClasses = false;
        this.showErrorToast('Gagal memuat daftar kelas');
      }
    });
  }

  onSubmitRegister() {
    if (this.registerForm.invalid) {
      this.showErrorToast('Mohon lengkapi semua field yang wajib diisi');
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    const username = this.registerForm.value.username;
    if (this.validationService.isUsernameTaken(username)) {
      this.showErrorToast('Username sudah digunakan. Silakan pilih username lain.');
      return;
    }

    this.loading = true;
    this.errorMsg = '';
    
    this.showInfoToast('Sedang memproses pendaftaran...');

    const payload = {
      nama_lengkap: this.registerForm.value.nama_lengkap,
      username: this.registerForm.value.username,
      password: this.registerForm.value.password,
      konfirmasi_password: this.registerForm.value.konfirmasi_password,
      role: 'siswa',
      sekolah: this.registerForm.value.sekolah,
      kelas: this.registerForm.value.kelas
    };

    console.log('📝 Registration payload:', payload);

    this.authService.register(payload).subscribe({
      next: (response) => {
        console.log('✅ Registration successful:', response);
        this.loading = false;
        
        // ✅ Refresh validation data setelah registrasi berhasil
        this.validationService.refreshUsersData();
        
        // ✅ PERBAIKAN: Langsung pindah ke login modal tanpa delay
        this.hideToast(); // Hide any existing toast immediately
        
        // Hide current modal first
        this.activeModal.hide();
        
        // Show login modal immediately
        const loginModalRef = this.modalService.show(LoginModalComponent, { 
          class: 'modal-dialog-centered',
          backdrop: 'static', // Prevent closing by clicking outside
          keyboard: false,
          initialState: {
            successMessage: 'Pendaftaran berhasil! Silakan login dengan akun Anda.',
            prefilledUsername: this.registerForm.value.username // Prefill username
          }
        });
        
        // ✅ TAMBAH: Show success message di login modal setelah modal terbuka
        setTimeout(() => {
          // Show success toast after login modal is opened
          this.showSuccessToastInParent('Pendaftaran berhasil! Silakan login dengan akun Anda.');
        }, 100);
      },
      error: (error) => {
        console.error('❌ Registration failed:', error);
        this.loading = false;
        
        if (error.status === 409) {
          this.showErrorToast('Username sudah terdaftar. Silakan gunakan username lain.');
        } else if (error.status === 400) {
          this.showErrorToast('Data registrasi tidak valid. Periksa kembali input Anda.');
        } else {
          this.showErrorToast('Gagal mendaftarkan akun. Silakan coba lagi.');
        }
        
        this.errorMsg = error?.error?.message || 'Registrasi gagal. Cek input!';
      }
    });
  }

  // ✅ TAMBAH: Method untuk show toast di parent component (jika ada)
  private showSuccessToastInParent(message: string): void {
    // Buat event atau gunakan service untuk show toast di level aplikasi
    // Untuk sementara, bisa gunakan console.log atau alert
    console.log('✅ Success:', message);
    
    // ✅ ALTERNATIF: Jika ingin tetap show toast, bisa gunakan service global toast
    // this.toastService.showSuccess(message);
    
    // ✅ ATAU: Gunakan browser notification
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Pendaftaran Berhasil!', {
          body: message,
          icon: '/assets/icons/success-icon.png' // Jika ada icon
        });
      }
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  // ✅ Toast methods
  private showSuccessToast(message: string): void {
    this.hideToast();
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
    this.hideToast();
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
    
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
