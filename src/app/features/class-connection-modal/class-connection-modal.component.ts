import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { faExclamation } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ClassService } from 'src/app/service/class.service';

interface AcademicYear {
  id: number;
  name: string;
}

@Component({
  selector: 'app-class-connection-modal',
  templateUrl: './class-connection-modal.component.html',
  styleUrls: ['./class-connection-modal.component.css']
})
export class ClassConnectionModalComponent implements OnInit {

  faExclamation = faExclamation;

  school: any;
  isMandatory: boolean = false;
  isFromLogin: boolean = false;
  classForm!: FormGroup;
  isFormInitialized = false;
  isSubmitting = false;
  submitError = '';
  classesCreated = 0;
  showToast = false;
  toastMessage = '';
  toastClass = '';
  toastIcon = '';
  private toastTimeout?: number;

  academicYears: AcademicYear[] = [
    { id: 1, name: '2023/2024' },
    { id: 2, name: '2024/2025' },
    { id: 3, name: '2025/2026' },
    { id: 4, name: '2026/2027' },
    { id: 5, name: '2027/2028' }
  ];

  constructor(
    public activeModal: BsModalRef,
    private classService: ClassService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {

    // Initialize the form first
    this.classForm = this.fb.group({
      classes: this.fb.array([])  // Initialize FormArray inside the formGroup
    });

    // Wait for next tick to ensure form is properly initialized
    setTimeout(() => {
      this.onAdd(); // Add first form group
      this.isFormInitialized = true; // Mark form as ready
    }, 0);
  }

  get classFormArray(): FormArray {
    return this.classForm?.get('classes') as FormArray;
  }

  get classFormControls(): FormGroup[] {
    if (!this.classFormArray) {
      return [];
    }
    return this.classFormArray.controls as FormGroup[];
  }

  onAdd() {
    if (!this.classForm) {
      return;
    }

    const classGroup = this.fb.group({
      nama_kelas: ['', Validators.required],
      tahun_ajaran: ['', Validators.required]
    });

    this.classFormArray.push(classGroup);
  }

  onRemove(event: any) {
    const index = event.index; // Ambil index yang diterima dari event
    if (this.classFormArray && this.classFormArray.length > 1) {
      this.classFormArray.removeAt(index);  // Hapus kelas/form input berdasarkan index
    }
  }

  getFormGroupAtIndex(index: number): FormGroup | null {
    if (!this.classFormArray || index < 0 || index >= this.classFormArray.length) {
      return null;
    }
    return this.classFormArray.at(index) as FormGroup;
  }

  onCancelClicked() {
    if (this.isMandatory) {
      if (confirm('Anda harus membuat minimal satu kelas untuk melanjutkan. Yakin ingin membatalkan?')) {
        return;
      }
    } else {
      this.activeModal.hide();
    }
  }

  onSubmitClicked() {
    if (!this.classForm || this.classForm.invalid) {
      this.showErrorToast('Mohon lengkapi semua field yang wajib diisi');
      this.markAllFieldsAsTouched();
      return;
    }

    const token = localStorage.getItem('token');
    const classes = this.classForm.value.classes;

    if (!classes || classes.length === 0) {
      this.showErrorToast('Minimal harus membuat satu kelas');
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';
    this.classesCreated = 0;

    this.showInfoToast(`Sedang membuat ${classes.length} kelas...`);

    let processedCount = 0;
    const totalClasses = classes.length;

    classes.forEach((kelas: any, index: number) => {
      this.classService.addClass({
        nama_kelas: kelas.nama_kelas,
        tahun_ajaran: kelas.tahun_ajaran,
        id_sekolah: this.school?._id
      }, token!).subscribe({
        next: (response) => {
          this.classesCreated++;
          processedCount++;

          if (this.classesCreated === 1) {
            this.showSuccessToast(`Kelas "${kelas.nama_kelas}" berhasil dibuat!`);
          }

          if (processedCount === totalClasses) {
            this.handleSubmissionComplete();
          }
        },
        error: (err) => {
          console.error(`❌ Failed to create class ${index + 1}:`, err);
          processedCount++;

          const errorMsg = err?.error?.message || 'Terjadi kesalahan';
          this.showErrorToast(`Gagal membuat kelas "${kelas.nama_kelas}": ${errorMsg}`);

          this.submitError = `Gagal membuat kelas "${kelas.nama_kelas}": ${errorMsg}`;

          if (processedCount === totalClasses) {
            this.handleSubmissionComplete();
          }
        }
      });
    });
  }

  private markAllFieldsAsTouched() {
    this.classFormControls.forEach(formGroup => {
      Object.keys(formGroup.controls).forEach(key => {
        formGroup.get(key)?.markAsTouched();
      });
    });
  }

  private handleSubmissionComplete() {
    this.isSubmitting = false;

    if (this.classesCreated > 0) {
      const successMsg = this.classesCreated > 1
        ? `Berhasil membuat ${this.classesCreated} kelas!`
        : 'Kelas berhasil dibuat!';
      this.showSuccessToast(successMsg);

      if (this.school && !localStorage.getItem('schoolId')) {
        localStorage.setItem('schoolId', this.school._id);
        localStorage.setItem('schoolName', this.school.nama);
      }

      setTimeout(() => {
        this.activeModal.hide();
      }, 2500);
    } else {
      this.showErrorToast('Tidak ada kelas yang berhasil dibuat');

      if (this.isMandatory) {
      } else {
        this.activeModal.hide();
      }
    }
  }

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
  }
}