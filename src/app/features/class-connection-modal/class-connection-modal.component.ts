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

  school: any;  // Data sekolah yang diterima dari modal sebelumnya
  isMandatory: boolean = false; // Whether class creation is mandatory
  isFromLogin: boolean = false; // Whether opened from login flow
  classForm!: FormGroup;  // FormGroup untuk menangani data kelas
  isFormInitialized = false; // Flag to check if form is ready
  isSubmitting = false; // Loading state for form submission
  submitError = ''; // Error message for submission
  classesCreated = 0; // Track how many classes were successfully created

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

  // Getter untuk mengakses FormArray dengan type yang benar
  get classFormArray(): FormArray {
    return this.classForm?.get('classes') as FormArray;
  }

  // Getter untuk mendapatkan array of FormGroup untuk template
  get classFormControls(): FormGroup[] {
    if (!this.classFormArray) {
      return [];
    }
    return this.classFormArray.controls as FormGroup[];
  }

  // Fungsi untuk menambah kelas baru
  onAdd() {
    if (!this.classForm) {
      return;
    }

    const classGroup = this.fb.group({
      nama_kelas: ['', Validators.required],
      tahun_ajaran: ['', Validators.required]
    });

    this.classFormArray.push(classGroup);  // Menambahkan FormGroup untuk kelas
  }

  // Fungsi untuk menghapus kelas berdasarkan index yang dipilih
  onRemove(event: any) {
    const index = event.index; // Ambil index yang diterima dari event
    if (this.classFormArray && this.classFormArray.length > 1) {
      this.classFormArray.removeAt(index);  // Hapus kelas/form input berdasarkan index
    }
  }

  // Method untuk mendapatkan FormGroup pada index tertentu
  getFormGroupAtIndex(index: number): FormGroup | null {
    if (!this.classFormArray || index < 0 || index >= this.classFormArray.length) {
      return null;
    }
    return this.classFormArray.at(index) as FormGroup;
  }

  onCancelClicked() {
    if (this.isMandatory) {
      // If class creation is mandatory, show confirmation message
      if (confirm('Anda harus membuat minimal satu kelas untuk melanjutkan. Yakin ingin membatalkan?')) {
        // User confirmed cancellation - this shouldn't happen in mandatory flow
        // But if it does, we don't close the modal
        return;
      }
    } else {
      // Normal cancellation for non-mandatory flow
      this.activeModal.hide();
    }
  }

  onSubmitClicked() {
    if (!this.classForm || this.classForm.invalid) {
      // Mark all fields as touched to show validation errors
      this.markAllFieldsAsTouched();
      return;  // Jangan lanjutkan jika form tidak valid
    }

    // Ambil nilai dari FormArray
    const token = localStorage.getItem('token');
    const classes = this.classForm.value.classes;

    if (!classes || classes.length === 0) {
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';
    this.classesCreated = 0;

    // Counter untuk track berapa kelas yang sudah diproses
    let processedCount = 0;
    const totalClasses = classes.length;

    // Kirim data kelas termasuk ID sekolah yang diteruskan dari modal sebelumnya
    classes.forEach((kelas: any, index: number) => {
      this.classService.addClass({
        nama_kelas: kelas.nama_kelas,
        tahun_ajaran: kelas.tahun_ajaran,
        id_sekolah: this.school?._id  // Use optional chaining
      }, token!).subscribe({
        next: (response) => {
          this.classesCreated++;
          processedCount++;
          
          // Check if all classes have been processed
          if (processedCount === totalClasses) {
            this.handleSubmissionComplete();
          }
        },
        error: (err) => {
          console.error(`❌ Failed to create class ${index + 1}:`, err);
          processedCount++;
          
          // Set error message
          this.submitError = `Gagal membuat kelas "${kelas.nama_kelas}": ${err?.error?.message || 'Terjadi kesalahan'}`;
          
          // Check if all classes have been processed
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
      
      // If at least one class was created successfully, close modal
      setTimeout(() => {
        this.activeModal.hide();
      }, 1000); // Short delay to show success message
    } else {
      
      // If no classes were created and it's mandatory, don't close modal
      if (this.isMandatory) {
        // Form will remain open with error message
      } else {
        // For non-mandatory flow, close modal even if creation failed
        this.activeModal.hide();
      }
    }
  }
}