import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClassService, ClassesBySchoolResponse } from 'src/app/service/class.service';
import { SchoolService, School } from 'src/app/service/school.service';

interface AcademicYear {
  id: number;
  name: string;
}

@Component({
  selector: 'app-class-edit',
  templateUrl: './class-edit.component.html',
  styleUrls: ['./class-edit.component.css']
})
export class ClassEditComponent implements OnInit {

  classForm: FormGroup;
  isSubmitting = false;
  isLoading = true;
  errorMsg = '';
  successMsg = '';
  school: any = null;
  classData: any = null;
  classId: string = '';
  existingDataList: any[] = [];
  
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
    private activatedRoute: ActivatedRoute,
    private classService: ClassService,
    private schoolService: SchoolService
  ) { 
    this.classForm = this.fb.group({
      className: ['', [Validators.required, Validators.minLength(2), this.classNameValidator.bind(this)]],
      academicYearId: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      this.classId = params['id'];
      
      if (this.classId) {
        this.loadClassData();
      } else {
        this.errorMsg = 'ID kelas tidak ditemukan.';
        this.isLoading = false;
      }
    });

    this.getTeacherSchool();
  }

  // ✅ TAMBAH METHOD BACK TO MANAGE CLASSES
  backToManageClasses(): void {
    this.router.navigate(['/guru/kelola-kelas']);
  }

  // Custom validator function untuk mengecek nama kelas yang sudah ada (kecuali kelas yang sedang diedit)
  classNameValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value || control.value.trim() === '') {
      return null;
    }

    const inputClassName = control.value.trim().toLowerCase();
    
    const isDuplicate = this.existingDataList.some(classData => 
      classData.nama_kelas.toLowerCase().trim() === inputClassName && 
      classData._id !== this.classId
    );

    return isDuplicate ? { classNameExists: true } : null;
  }

  private loadClassData(): void {
    this.isLoading = true;
    const token = localStorage.getItem('token');

    if (!token) {
      this.errorMsg = 'Token tidak ditemukan. Silakan login ulang.';
      this.isLoading = false;
      return;
    }

    this.classService.getClassById(this.classId, token).subscribe({
      next: (response: any) => {
        
        let classData = null;
        if (response && response.data) {
          classData = response.data;
        } else if (response && response._id) {
          classData = response;
        } else {
          classData = response;
        }

        if (classData) {
          this.classData = classData;
          this.patchFormWithClassData();
        } else {
          this.errorMsg = 'Data kelas tidak ditemukan.';
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading class data:', error);
        this.errorMsg = 'Gagal memuat data kelas. Silakan coba lagi.';
        this.isLoading = false;
      }
    });
  }

  private patchFormWithClassData(): void {
    if (!this.classData) return;

    const matchingYear = this.academicYears.find(year => 
      year.name === this.classData.tahun_ajaran
    );

    this.classForm.patchValue({
      className: this.classData.nama_kelas || '',
      academicYearId: matchingYear ? matchingYear.id : (this.classData.tahun_ajaran || '')
    });

    if (matchingYear) {
      this.selectedAcademicYear = matchingYear;
    }

  }

  private getTeacherSchool(): void {
    
    this.schoolService.getMySchool().subscribe({
      next: (response: School) => {
        
        this.school = response;
        
        const schoolId = this.school?._id;
        if (!schoolId) {
          this.errorMsg = 'Data sekolah tidak lengkap. ID sekolah tidak ditemukan.';
          console.error('No school ID found in:', this.school);
        } else {
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
        
        if (response.success && response.data && Array.isArray(response.data)) {
          this.existingDataList = response.data.filter(cls => cls._id !== this.classId);
        } else {
          this.existingDataList = [];
        }
        
        this.classForm.get('className')?.updateValueAndValidity();
      },
      error: (error) => {
        console.error('Error loading existing classes:', error);
        this.existingDataList = [];
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

    if (!this.classId) {
      this.errorMsg = 'ID kelas tidak valid.';
      return;
    }

    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMsg = '';
    this.successMsg = '';

    const formData = this.classForm.value;
    const selectedYear = this.academicYears.find(year => year.id === formData.academicYearId);
    const token = localStorage.getItem('token');

    if (!token) {
      this.errorMsg = 'Token tidak ditemukan. Silakan login ulang.';
      this.isSubmitting = false;
      return;
    }

    const updateData = {
      nama_kelas: formData.className.trim(),
      tahun_ajaran: selectedYear?.name || formData.academicYearId
    };

    this.classService.updateClass(this.classId, updateData, token).subscribe({
      next: (response: any) => {
        
        this.successMsg = `Kelas "${updateData.nama_kelas}" berhasil diperbarui!`;
        
        setTimeout(() => {
          this.router.navigate(['/guru/kelola-kelas']);
        }, 2000);
      },
      error: (err: any) => {
        console.error('Error updating class:', err);
        console.error('Error details:', {
          status: err.status,
          message: err.error?.message,
          error: err.error
        });
        
        if (err.status === 404) {
          this.errorMsg = 'Kelas tidak ditemukan.';
        } else if (err.status === 400) {
          this.errorMsg = 'Data yang dikirim tidak valid. Periksa kembali form Anda.';
        } else if (err.status === 403) {
          this.errorMsg = 'Anda tidak memiliki akses untuk mengubah kelas ini.';
        } else {
          this.errorMsg = err?.error?.message || 'Gagal memperbarui kelas. Silakan coba lagi.';
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

  getExistingClassNames(): string[] {
    return this.existingDataList.map(cls => cls.nama_kelas);
  }

  onClassNameInput(): void {
    const classNameControl = this.classForm.get('className');
    if (classNameControl) {
      classNameControl.updateValueAndValidity();
    }
  }
}
