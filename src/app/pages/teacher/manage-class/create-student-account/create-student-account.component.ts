import { Component, OnInit, OnDestroy } from '@angular/core';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/service/auth.service';
import { SchoolService } from 'src/app/service/school.service';
import { ClassService, ClassesBySchoolResponse } from 'src/app/service/class.service';
import { ValidationService } from 'src/app/service/validation.service'; // ✅ TAMBAH
import { CustomValidators } from 'src/app/validators/custom-validators'; // ✅ TAMBAH
import { debounceTime, distinctUntilChanged } from 'rxjs/operators'; // ✅ TAMBAH
import { Subscription } from 'rxjs'; // ✅ TAMBAH

@Component({
  selector: 'app-create-student-account',
  templateUrl: './create-student-account.component.html',
  styleUrls: ['./create-student-account.component.css']
})
export class CreateStudentAccountComponent implements OnInit, OnDestroy {

  registerForm!: FormGroup;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  passwordVisible = false;
  confirmPasswordVisible = false;
  loading = false;
  errorMsg = '';

  schools: any[] = [];
  classes: any[] = [];
  currentSchool: any = null;

  loadingSchools = false;
  loadingClasses = false;

  // Data dari route
  currentClassId: string = '';

  // ✅ TAMBAH: Toast properties
  showToast = false;
  toastMessage = '';
  toastClass = '';
  toastIcon = '';
  private toastTimeout?: number;

  // ✅ TAMBAH: Validation properties
  usernameError = '';
  usernameSuggestions: string[] = [];
  validationDataLoaded = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private schoolService: SchoolService,
    private classService: ClassService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private validationService: ValidationService // ✅ TAMBAH
  ) {}

  ngOnInit(): void {
    // Extract class ID dari URL
    const url = this.router.url;
    const urlSegments = url.split('/');
    const detailKelasIndex = urlSegments.findIndex(segment => segment === 'detail-kelas');
    if (detailKelasIndex !== -1 && urlSegments[detailKelasIndex + 1]) {
      this.currentClassId = urlSegments[detailKelasIndex + 1];
    }

    // ✅ SELARASKAN: Init form dengan custom validators
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

    // Load sekolah guru saat ini
    this.loadCurrentSchool();
    this.setupSchoolChange();

    // ✅ TAMBAH: Real-time username validation
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

    // ✅ TAMBAH: Wait for validation data to load
    const validationSub = this.validationService.isDataLoaded.subscribe((loaded) => {
      this.validationDataLoaded = loaded;
      if (loaded && this.registerForm.get('username')?.value) {
        this.validateUsername(this.registerForm.get('username')?.value);
      }
    });
    this.subscriptions.push(validationSub);
  }

  // ✅ TAMBAH: Method untuk validasi username real-time
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

  // ✅ TAMBAH: Method untuk use suggested username
  useSuggestedUsername(suggestion: string): void {
    this.registerForm.patchValue({ username: suggestion });
    this.usernameError = '';
    this.usernameSuggestions = [];
  }

  // ✅ TAMBAH: Method untuk get first error message
  getFirstErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    if (!control || !control.errors || !control.touched) return '';
    
    return CustomValidators.getFirstErrorMessage(control, controlName);
  }

  // ✅ TAMBAH METHOD BACK TO CONNECT STUDENT
  backToConnectStudent(): void {
    this.router.navigate(['/guru/kelola-kelas/detail-kelas', this.currentClassId, 'tambah-siswa']);
  }

  private loadCurrentSchool(): void {
    this.loadingSchools = true;
    this.errorMsg = '';
    const token = localStorage.getItem('token');

    if (!token) {
      this.errorMsg = 'Token tidak ditemukan. Silakan login ulang.';
      this.loadingSchools = false;
      return;
    }

    this.schoolService.getMySchool().subscribe({
      next: (response: any) => {
        
        let school = null;
        if (response && response.data) {
          school = response.data;
        } else if (response && response._id) {
          school = response;
        } else {
          school = response;
        }

        if (school && school._id) {
          this.currentSchool = school;
          this.schools = [school];
          
          // Auto-select sekolah guru
          this.registerForm.patchValue({ sekolah: school._id });
          
          // Simpan schoolId ke localStorage
          localStorage.setItem('schoolId', school._id);
          
          this.loadingSchools = false;
          
          // Load classes setelah school berhasil dimuat
          this.loadClassesBySchool(school._id);
        } else {
          this.errorMsg = 'Tidak dapat menemukan sekolah yang Anda kelola.';
          this.loadingSchools = false;
        }
      },
      error: (error) => {
        console.error('❌ Error loading current school:', error);
        this.errorMsg = 'Gagal memuat informasi sekolah. Silakan coba lagi.';
        this.loadingSchools = false;
      }
    });
  }

  private setupSchoolChange(): void {
    // Load kelas ketika sekolah dipilih
    this.registerForm.get('sekolah')!.valueChanges.subscribe((schoolId) => {
      
      if (schoolId && !this.loadingSchools) {
        // Hanya load jika tidak sedang loading school dan ada schoolId
        this.loadClassesBySchool(schoolId);
      } else if (!schoolId) {
        this.classes = [];
        this.registerForm.patchValue({ kelas: '' });
      }
    });
  }

  private loadClassesBySchool(schoolId: string): void {
    this.loadingClasses = true;
    this.errorMsg = '';
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('No token available for loading classes');
      this.loadingClasses = false;
      return;
    }

    this.classService.getClassesBySchool(schoolId, token).subscribe({
      next: (response: ClassesBySchoolResponse) => {
        if (response.success && response.data && Array.isArray(response.data)) {
          // ✅ FILTER: Hanya tampilkan kelas yang TIDAK diarsipkan (archived_at = null)
          this.classes = response.data.filter(cls => !cls.archived_at);
          
          // Auto-select current class jika ada
          this.autoSelectCurrentClass();
        } else {
          this.classes = [];
        }
        
        this.loadingClasses = false;
      },
      error: (error) => {
        console.error('❌ Error loading classes:', error);
        this.classes = [];
        this.loadingClasses = false;
        
        if (error.status === 403) {
          this.errorMsg = 'Anda tidak memiliki akses untuk melihat kelas di sekolah ini.';
        } else if (error.status === 404) {
          this.errorMsg = 'Sekolah tidak ditemukan.';
        } else {
          this.errorMsg = 'Gagal memuat daftar kelas. Silakan coba lagi.';
        }
      }
    });
  }

  private autoSelectCurrentClass(): void {
    if (this.currentClassId && this.classes.length > 0) {
      const currentClass = this.classes.find(cls => cls._id === this.currentClassId);
      if (currentClass) {
        this.registerForm.patchValue({ kelas: this.currentClassId });
      } else {
        console.log('Current class not found in available classes');
      }
    }
  }

  onSubmitClicked(): void {
    if (this.registerForm.invalid) {
      this.showErrorToast('Mohon lengkapi semua field yang wajib diisi');
      this.markFormGroupTouched();
      return;
    }

    // ✅ TAMBAH: Double-check validasi sebelum submit
    const username = this.registerForm.value.username;
    if (this.validationService.isUsernameTaken(username)) {
      this.showErrorToast('Username sudah digunakan. Silakan pilih username lain.');
      return;
    }

    this.loading = true;
    this.errorMsg = '';
    
    this.showInfoToast('Sedang membuat akun siswa...');

    const payload = {
      nama_lengkap: this.registerForm.value.nama_lengkap,
      username: this.registerForm.value.username,
      password: this.registerForm.value.password,
      konfirmasi_password: this.registerForm.value.konfirmasi_password,
      role: 'siswa',
      sekolah: this.registerForm.value.sekolah,
      kelas: this.registerForm.value.kelas
    };

    console.log('📝 Create student account payload:', payload);

    this.authService.register(payload).subscribe({
      next: (response) => {
        console.log('✅ Student account created successfully:', response);
        this.loading = false;
        
        // ✅ Refresh validation data setelah registrasi berhasil
        this.validationService.refreshUsersData();
        
        this.showSuccessToast('Akun siswa berhasil dibuat!');
        
        // Navigate back to connect student page setelah delay singkat
        setTimeout(() => {
          this.backToConnectStudent();
        }, 0);
      },
      error: (error) => {
        console.error('❌ Error creating student account:', error);
        this.loading = false;
        
        if (error.status === 400) {
          this.showErrorToast('Data yang dimasukkan tidak valid. Periksa kembali form Anda.');
        } else if (error.status === 409) {
          this.showErrorToast('Username sudah digunakan. Silakan gunakan username lain.');
        } else if (error.status === 422) {
          this.showErrorToast('Format data tidak sesuai. Periksa kembali input Anda.');
        } else {
          this.showErrorToast('Gagal membuat akun siswa. Silakan coba lagi.');
        }
        
        this.errorMsg = error?.error?.message || 'Gagal membuat akun siswa. Silakan coba lagi.';
      }
    });
  }

  onCancelClicked(): void {
    this.backToConnectStudent();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  // ✅ TAMBAH: Toast methods
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
