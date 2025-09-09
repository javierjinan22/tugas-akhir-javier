import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { faExclamation } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { TeacherProgressService, FeedbackPayload } from 'src/app/service/teacher-progress.service';

@Component({
  selector: 'app-modal-add-feedback',
  templateUrl: './modal-add-feedback.component.html',
  styleUrls: ['./modal-add-feedback.component.css']
})
export class ModalAddFeedbackComponent implements OnInit {

  faExclamationCircle = faExclamationCircle;
  faExclamation = faExclamation;
  feedback: string = '';
  loading: boolean = false;
  errorMsg: string = '';

  // ✅ TAMBAH: Properties yang akan diisi dari component parent
  public siswa: any; // Legacy property
  student: any;
  materiInfo: any;
  materiId: string = '';
  classId: string = '';
  onFeedbackSent: () => void = () => {};

  constructor(
    public activeModal: BsModalRef,
    private modalService: BsModalService,
    private teacherProgressService: TeacherProgressService
  ) { }

  ngOnInit(): void {
    console.log('Modal initialized with:', {
      student: this.student,
      materiInfo: this.materiInfo,
      materiId: this.materiId,
      classId: this.classId
    });
  }

  onCancelClicked(): void {
    this.activeModal.hide();
  }

  onSubmitClicked(): void {
    if (!this.feedback || this.feedback.trim() === '') {
      this.errorMsg = 'Feedback tidak boleh kosong';
      return;
    }

    if (!this.student || !this.materiId) {
      this.errorMsg = 'Data siswa atau materi tidak valid';
      return;
    }

    this.sendFeedback();
  }

  // ✅ TAMBAH: Method untuk send feedback
  sendFeedback(): void {
    this.loading = true;
    this.errorMsg = '';

    const feedbackData: FeedbackPayload = {
      student_id: this.student._id,
      materi_id: this.materiId,
      feedback_text: this.feedback.trim()
    };

    console.log('Sending feedback:', feedbackData);

    // Validate feedback
    const validation = this.teacherProgressService.validateFeedback(feedbackData);
    if (!validation.isValid) {
      this.errorMsg = validation.errors.join(', ');
      this.loading = false;
      return;
    }

    this.teacherProgressService.sendStudentFeedback(feedbackData).subscribe({
      next: (response) => {
        console.log('✅ Feedback sent successfully:', response);
        
        if (response.success) {
          // Success - close modal dan call callback
          this.onFeedbackSent();
          this.activeModal.hide();
          
          // Optional: Show success message
          console.log('Feedback berhasil dikirim ke', response.data.student_name);
        } else {
          this.errorMsg = response.message || 'Gagal mengirim feedback';
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error sending feedback:', error);
        
        let errorMessage = 'Gagal mengirim feedback. ';
        
        if (error.status === 401) {
          errorMessage += 'Sesi login telah berakhir.';
        } else if (error.status === 403) {
          errorMessage += 'Anda tidak memiliki akses.';
        } else if (error.status === 404) {
          errorMessage += 'Siswa atau materi tidak ditemukan.';
        } else if (error.status === 0) {
          errorMessage += 'Tidak dapat terhubung ke server.';
        } else {
          errorMessage += 'Silakan coba lagi.';
        }
        
        this.errorMsg = errorMessage;
        this.loading = false;
      }
    });
  }

  // ✅ TAMBAH: Get student name untuk display
  getStudentName(): string {
    return this.student?.nama_siswa || this.siswa?.nama_siswa || 'Siswa';
  }

  // ✅ TAMBAH: Get material name untuk display
  getMaterialName(): string {
    return this.materiInfo?.judul_materi || 'Materi';
  }
}
