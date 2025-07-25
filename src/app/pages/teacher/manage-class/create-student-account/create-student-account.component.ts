import { Component, OnInit } from '@angular/core';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/service/auth.service';
import { SchoolService } from 'src/app/service/school.service';
import { ClassService, ClassesBySchoolResponse } from 'src/app/service/class.service';

@Component({
  selector: 'app-create-student-account',
  templateUrl: './create-student-account.component.html',
  styleUrls: ['./create-student-account.component.css']
})
export class CreateStudentAccountComponent implements OnInit {

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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private schoolService: SchoolService,
    private classService: ClassService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Extract class ID dari URL
    const url = this.router.url;
    const urlSegments = url.split('/');
    const detailKelasIndex = urlSegments.findIndex(segment => segment === 'detail-kelas');
    if (detailKelasIndex !== -1 && urlSegments[detailKelasIndex + 1]) {
      this.currentClassId = urlSegments[detailKelasIndex + 1];
    }

    // Init form
    this.registerForm = this.fb.group({
      nama_lengkap: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', Validators.required],
      konfirmasi_password: ['', Validators.required],
      sekolah: ['', Validators.required],
      kelas: ['', Validators.required],
    });

    // Load sekolah guru saat ini
    this.loadCurrentSchool();
    this.setupSchoolChange();
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
      this.markFormGroupTouched();
      this.errorMsg = 'Mohon lengkapi semua field yang diperlukan.';
      return;
    }

    if (this.registerForm.value.password !== this.registerForm.value.konfirmasi_password) {
      this.errorMsg = "Password dan konfirmasi password tidak cocok!";
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    const payload = {
      nama_lengkap: this.registerForm.value.nama_lengkap,
      username: this.registerForm.value.username,
      password: this.registerForm.value.password,
      konfirmasi_password: this.registerForm.value.konfirmasi_password,
      role: 'siswa',
      sekolah: this.registerForm.value.sekolah,
      kelas: this.registerForm.value.kelas
    };

    this.authService.register(payload).subscribe({
      next: (response) => {
        this.loading = false;
        
        alert('Akun siswa berhasil dibuat!');
        
        // Navigate back to connect student page
        this.backToConnectStudent();
      },
      error: (error) => {
        console.error('Error creating student account:', error);
        this.loading = false;
        
        if (error.status === 400) {
          this.errorMsg = 'Data yang dimasukkan tidak valid. Periksa kembali form Anda.';
        } else if (error.status === 409) {
          this.errorMsg = 'Username sudah digunakan. Silakan gunakan username lain.';
        } else if (error.status === 422) {
          this.errorMsg = 'Format data tidak sesuai. Periksa kembali input Anda.';
        } else {
          this.errorMsg = error?.error?.message || 'Gagal membuat akun siswa. Silakan coba lagi.';
        }
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

}
