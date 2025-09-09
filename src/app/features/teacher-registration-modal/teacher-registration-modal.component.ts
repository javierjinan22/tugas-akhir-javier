import { Component, OnInit, OnDestroy } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/service/auth.service';
import { ValidationService } from 'src/app/service/validation.service';
import { CustomValidators } from 'src/app/validators/custom-validators';
import { LoginModalComponent } from '../login-modal/login-modal.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-teacher-registration-modal',
  templateUrl: './teacher-registration-modal.component.html',
  styleUrls: ['./teacher-registration-modal.component.css']
})
export class TeacherRegistrationModalComponent implements OnInit, OnDestroy {

  registerForm!: FormGroup;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  passwordVisible = false;
  confirmPasswordVisible = false;
  loading = false;
  errorMsg = '';

  // ✅ Toast properties
  showToast = false;
  toastMessage = '';
  toastClass = '';
  toastIcon = '';
  private toastTimeout?: number;

  // ✅ Validation properties
  usernameError = '';
  usernameSuggestions: string[] = [];
  emailError = '';
  emailSuggestions: string[] = [];
  nuptkError = '';
  validationDataLoaded = false;
  private subscriptions: Subscription[] = [];

  constructor(
    public activeModal: BsModalRef,
    private modalService: BsModalService,
    private fb: FormBuilder,
    private authService: AuthService,
    private validationService: ValidationService
  ) {}

  ngOnInit(): void {
    // ✅ Init form dengan custom validators
    this.registerForm = this.fb.group({
      nama_lengkap: ['', [Validators.required, CustomValidators.fullName()]],
      email: ['', [Validators.required, CustomValidators.email()]],
      username: ['', [Validators.required, CustomValidators.username()]],
      password: ['', [Validators.required, CustomValidators.password()]],
      konfirmasi_password: ['', Validators.required],
      role: ['guru'],
      nuptk: ['', [Validators.required, CustomValidators.nuptk()]],
      instansi: ['', [Validators.required, CustomValidators.instansi()]],
    }, {
      validators: CustomValidators.passwordMatch('password', 'konfirmasi_password')
    });

    // ✅ Real-time username validation
    const usernameSub = this.registerForm.get('username')!.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((username) => {
        if (this.validationDataLoaded) {
          this.validateUsername(username);
        }
      });
    this.subscriptions.push(usernameSub);

    // ✅ Real-time email validation
    const emailSub = this.registerForm.get('email')!.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((email) => {
        if (this.validationDataLoaded) {
          this.validateEmail(email);
        }
      });
    this.subscriptions.push(emailSub);

    // ✅ Real-time NUPTK validation
    const nuptkSub = this.registerForm.get('nuptk')!.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((nuptk) => {
        if (this.validationDataLoaded) {
          this.validateNuptk(nuptk);
        }
      });
    this.subscriptions.push(nuptkSub);

    // ✅ Wait for validation data to load
    const validationSub = this.validationService.isDataLoaded.subscribe((loaded) => {
      this.validationDataLoaded = loaded;
      if (loaded) {
        const username = this.registerForm.get('username')?.value;
        const email = this.registerForm.get('email')?.value;
        const nuptk = this.registerForm.get('nuptk')?.value;
        
        if (username) this.validateUsername(username);
        if (email) this.validateEmail(email);
        if (nuptk) this.validateNuptk(nuptk);
      }
    });
    this.subscriptions.push(validationSub);

    // ✅ Format NUPTK input while typing
    const nuptkFormatSub = this.registerForm.get('nuptk')!.valueChanges.subscribe((nuptk) => {
      if (nuptk) {
        const formatted = this.validationService.formatNuptk(nuptk);
        if (formatted !== nuptk) {
          this.registerForm.get('nuptk')?.setValue(formatted, { emitEvent: false });
        }
      }
    });
    this.subscriptions.push(nuptkFormatSub);
  }

  // ✅ Method untuk validasi username real-time
  private validateUsername(username: string): void {
    this.usernameError = '';
    this.usernameSuggestions = [];

    if (!username || username.trim() === '') {
      return;
    }

    // Check basic validation first
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

  // ✅ Method untuk validasi email real-time
  private validateEmail(email: string): void {
    this.emailError = '';
    this.emailSuggestions = [];

    if (!email || email.trim() === '') {
      return;
    }

    // Check basic validation first
    const emailControl = this.registerForm.get('email');
    if (emailControl?.errors && !emailControl.errors['emailTaken']) {
      return; // Don't check duplication if basic validation fails
    }

    // Check if email is taken
    if (this.validationService.isEmailTaken(email)) {
      this.emailError = 'Email sudah digunakan';
      this.emailSuggestions = this.validationService.getEmailSuggestions(email);
      
      // Set custom error
      emailControl?.setErrors({ 
        ...emailControl.errors, 
        emailTaken: { message: 'Email sudah digunakan' }
      });
    } else {
      // Remove emailTaken error if exists
      if (emailControl?.errors) {
        delete emailControl.errors['emailTaken'];
        if (Object.keys(emailControl.errors).length === 0) {
          emailControl.setErrors(null);
        }
      }
    }
  }

  // ✅ Method untuk validasi NUPTK real-time
  private validateNuptk(nuptk: string): void {
    this.nuptkError = '';

    if (!nuptk || nuptk.trim() === '') {
      return;
    }

    // Check basic validation first
    const nuptkControl = this.registerForm.get('nuptk');
    if (nuptkControl?.errors && !nuptkControl.errors['nuptkTaken']) {
      return; // Don't check duplication if basic validation fails
    }

    // Check if NUPTK is taken
    if (this.validationService.isNuptkTaken(nuptk)) {
      this.nuptkError = 'NUPTK sudah terdaftar';
      
      // Set custom error
      nuptkControl?.setErrors({ 
        ...nuptkControl.errors, 
        nuptkTaken: { message: 'NUPTK sudah terdaftar' }
      });
    } else {
      // Remove nuptkTaken error if exists
      if (nuptkControl?.errors) {
        delete nuptkControl.errors['nuptkTaken'];
        if (Object.keys(nuptkControl.errors).length === 0) {
          nuptkControl.setErrors(null);
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

  // ✅ Method untuk use suggested email
  useSuggestedEmail(suggestion: string): void {
    this.registerForm.patchValue({ email: suggestion });
    this.emailError = '';
    this.emailSuggestions = [];
  }

  // ✅ Method untuk get first error message
  getFirstErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    if (!control || !control.errors || !control.touched) return '';
    
    return CustomValidators.getFirstErrorMessage(control, controlName);
  }

  onSubmitRegister() {
    if (this.registerForm.invalid) {
      this.showErrorToast('Mohon lengkapi semua field yang wajib diisi');
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    // ✅ Double-check validasi sebelum submit
    const username = this.registerForm.value.username;
    const email = this.registerForm.value.email;
    const nuptk = this.registerForm.value.nuptk;

    if (this.validationService.isUsernameTaken(username)) {
      this.showErrorToast('Username sudah digunakan. Silakan pilih username lain.');
      return;
    }

    if (this.validationService.isEmailTaken(email)) {
      this.showErrorToast('Email sudah digunakan. Silakan gunakan email lain.');
      return;
    }

    if (this.validationService.isNuptkTaken(nuptk)) {
      this.showErrorToast('NUPTK sudah terdaftar. Periksa kembali NUPTK Anda.');
      return;
    }

    this.loading = true;
    this.errorMsg = '';
    
    this.showInfoToast('Sedang memproses pendaftaran...');

    // ✅ Clean NUPTK before sending (remove dashes)
    const payload = {
      ...this.registerForm.value,
      nuptk: this.registerForm.value.nuptk.replace(/\D/g, '') // Send only digits
    };

    console.log('📝 Teacher registration payload:', payload);

    this.authService.register(payload).subscribe({
      next: (response) => {
        console.log('✅ Teacher registration successful:', response);
        this.loading = false;
        
        // ✅ Refresh validation data setelah registrasi berhasil
        this.validationService.refreshUsersData();
        
        // ✅ Langsung pindah ke login modal tanpa delay
        this.hideToast();
        
        // Hide current modal first
        this.activeModal.hide();
        
        // Show login modal immediately
        const loginModalRef = this.modalService.show(LoginModalComponent, { 
          class: 'modal-dialog-centered',
          backdrop: 'static',
          keyboard: false,
          initialState: {
            successMessage: 'Pendaftaran guru berhasil! Silakan login dengan akun Anda.',
            prefilledUsername: this.registerForm.value.username
          }
        });
      },
      error: (error) => {
        console.error('❌ Teacher registration failed:', error);
        this.loading = false;
        
        if (error.status === 409) {
          this.showErrorToast('Data sudah terdaftar. Silakan periksa username, email, atau NUPTK.');
        } else if (error.status === 400) {
          this.showErrorToast('Data registrasi tidak valid. Periksa kembali input Anda.');
        } else {
          this.showErrorToast('Gagal mendaftarkan akun. Silakan coba lagi.');
        }
        
        this.errorMsg = error?.error?.message || 'Registrasi gagal. Cek input!';
      }
    });
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
