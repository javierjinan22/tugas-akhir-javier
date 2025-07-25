import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { ClassService, ClassesBySchoolResponse } from 'src/app/service/class.service';
import { SchoolService, School } from 'src/app/service/school.service';

interface AcademicYear {
  id: number;
  name: string;
}

@Component({
  selector: 'app-create-new-class',
  templateUrl: './create-new-class.component.html',
  styleUrls: ['./create-new-class.component.css']
})
export class CreateNewClassComponent implements OnInit {

  classForm: FormGroup;
  isSubmitting = false;
  errorMsg = '';
  school: any = null;
  existingDataList: any[] = []; // Array untuk menyimpan data kelas yang sudah ada
  
  academicYears: AcademicYear[] = [
    { id: 1, name: '2023/2024' },
    { id: 2, name: '2024/2025' },
    { id: 3, name: '2025/2026' },
    { id: 4, name: '2026/2027' },
    { id: 5, name: '2027/2028' }
  ];

  selectedAcademicYear: AcademicYear | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private classService: ClassService,
    private schoolService: SchoolService
  ) { 
    this.classForm = this.fb.group({
      className: ['', [Validators.required, Validators.minLength(2), this.classNameValidator.bind(this)]],
      academicYearId: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Set default to current academic year (2025/2026)
    this.selectedAcademicYear = this.academicYears.find(year => year.name === '2025/2026') || this.academicYears[2];
    this.classForm.patchValue({
      academicYearId: this.selectedAcademicYear.id
    });

    this.getTeacherSchool();
  }

  // ✅ TAMBAH METHOD BACK TO MANAGE CLASSES
  backToManageClasses(): void {
    this.router.navigate(['/guru/kelola-kelas']);
  }

  // Custom validator function untuk mengecek nama kelas yang sudah ada
  classNameValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value || control.value.trim() === '') {
      return null;
    }

    const inputClassName = control.value.trim().toLowerCase();
    
    // Cek apakah nama kelas sudah ada di array existingDataList
    const isDuplicate = this.existingDataList.some(classData => 
      classData.nama_kelas.toLowerCase().trim() === inputClassName
    );

    return isDuplicate ? { classNameExists: true } : null;
  }

  private getTeacherSchool(): void {
    
    this.schoolService.getMySchool().subscribe({
      next: (response: School) => {
        // Response langsung berupa School object
        this.school = response;
        
        // Check if we have a valid school ID
        const schoolId = this.school?._id;
        if (!schoolId) {
          this.errorMsg = 'Data sekolah tidak lengkap. ID sekolah tidak ditemukan.';
          console.error('No school ID found in:', this.school);
        } else {
          // Load existing classes setelah mendapat data sekolah
          this.loadExistingClasses(schoolId);
        }
      },
      error: (err: any) => {
        console.error('Error getting school:', err);
        this.errorMsg = 'Tidak dapat mengambil data sekolah. Pastikan Anda sudah terdaftar di sekolah.';
        
        if (err.status === 404) {
          this.errorMsg = 'Anda belum terhubung dengan sekolah manapun. Silakan hubungi admin untuk menghubungkan akun Anda dengan sekolah.';
        }
      }
    });
  }

  private loadExistingClasses(schoolId: string): void {
    const token = localStorage.getItem('token');
    if (!token) return;


    this.classService.getClassesBySchool(schoolId, token).subscribe({
      next: (response: ClassesBySchoolResponse) => {
        
        // ✅ PERBAIKAN: Ambil array dari response.data dan filter yang tidak diarsipkan
        if (response.success && response.data && Array.isArray(response.data)) {
          this.existingDataList = response.data.filter(cls => !cls.archived_at);
        } else {
          console.warn('Unexpected response structure:', response);
          this.existingDataList = [];
        }
        
        // Update validator setelah data loaded
        this.classForm.get('className')?.updateValueAndValidity();
      },
      error: (error) => {
        console.error('Error loading existing classes:', error);
        this.existingDataList = []; // Set empty array jika error
      }
    });
  }

  onCancelClicked(): void {
    this.router.navigate(['/guru/kelola-kelas']);
  }

  onSubmitClicked(): void {
    if (this.classForm.invalid) {
      Object.keys(this.classForm.controls).forEach(key => {
        const control = this.classForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    if (!this.school) {
      this.errorMsg = 'Data sekolah tidak ditemukan. Silakan refresh halaman dan coba lagi.';
      return;
    }

    // Get school ID
    const schoolId = this.school._id;
    if (!schoolId) {
      this.errorMsg = 'ID sekolah tidak valid. Silakan hubungi admin.';
      console.error('Invalid school data:', this.school);
      return;
    }

    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMsg = '';

    const formData = this.classForm.value;
    const selectedYear = this.academicYears.find(year => year.id === formData.academicYearId);
    const token = localStorage.getItem('token');

    if (!token) {
      this.errorMsg = 'Token tidak ditemukan. Silakan login ulang.';
      this.isSubmitting = false;
      return;
    }

    // Format payload sesuai dengan API specification
    const classData = {
      nama_kelas: formData.className.trim(),
      tahun_ajaran: selectedYear?.name || formData.academicYearId,
      id_sekolah: schoolId
    };


    this.classService.addClass(classData, token).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.router.navigate(['/guru/kelola-kelas']);
        } else {
          this.errorMsg = response.message || 'Gagal membuat kelas. Silakan coba lagi.';
        }
      },
      error: (err: any) => {
        console.error('Error creating class:', err);
        console.error('Error details:', {
          status: err.status,
          message: err.error?.message,
          error: err.error
        });
        
        if (err.status === 404 && err.error?.message === 'Sekolah tidak ditemukan') {
          this.errorMsg = `Sekolah dengan ID ${schoolId} tidak ditemukan di database. Silakan hubungi admin.`;
        } else if (err.status === 400) {
          this.errorMsg = 'Data yang dikirim tidak valid. Periksa kembali form Anda.';
        } else {
          this.errorMsg = err?.error?.message || 'Gagal membuat kelas. Silakan coba lagi.';
        }
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.classForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  // Check if field has specific error
  hasFieldError(fieldName: string, errorType: string): boolean {
    const field = this.classForm.get(fieldName);
    return field ? field.hasError(errorType) && (field.dirty || field.touched) : false;
  }
  
  onAcademicYearChange(year: AcademicYear): void {
    this.selectedAcademicYear = year;
    this.classForm.patchValue({
      academicYearId: year.id
    });
  }

  // Get existing class names for display (optional)
  getExistingClassNames(): string[] {
    return this.existingDataList.map(cls => cls.nama_kelas);
  }

  // Method untuk trigger validation saat user mengetik
  onClassNameInput(): void {
    const classNameControl = this.classForm.get('className');
    if (classNameControl) {
      classNameControl.updateValueAndValidity();
    }
  }
}
