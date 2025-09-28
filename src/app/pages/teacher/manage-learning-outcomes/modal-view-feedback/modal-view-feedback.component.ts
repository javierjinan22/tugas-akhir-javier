import { Component, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { TeacherProgressService, StudentFeedback, GetStudentFeedbackResponse } from 'src/app/service/teacher-progress.service';
import { ModalAddFeedbackComponent } from '../modal-add-feedback/modal-add-feedback.component';

@Component({
  selector: 'app-modal-view-feedback',
  templateUrl: './modal-view-feedback.component.html',
  styleUrls: ['./modal-view-feedback.component.css']
})
export class ModalViewFeedbackComponent implements OnInit {

  loading: boolean = false;
  errorMsg: string = '';
  feedbackList: StudentFeedback[] = []; // ✅ UBAH: Kembali ke array
  total: number = 0;  // ✅ TAMBAH: Total count

  // Properties dari parent component
  public student: any;
  public materiInfo: any;
  public materiId: string = '';
  public classId: string = '';
  public onFeedbackUpdated: () => void = () => {};

  constructor(
    public activeModal: BsModalRef,
    private modalService: BsModalService,
    private teacherProgressService: TeacherProgressService
  ) { }

  ngOnInit(): void {
    console.log('View Feedback Modal initialized with:', {
      student: this.student,
      materiInfo: this.materiInfo,
      materiId: this.materiId,
      classId: this.classId
    });

    this.loadFeedback();
  }

  // ✅ PERBAIKI: Load feedback dari backend
  loadFeedback(): void {
    if (!this.student?._id || !this.materiId) {
      this.errorMsg = 'Data siswa atau materi tidak valid';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    this.teacherProgressService.getStudentFeedback(this.student._id, this.materiId).subscribe({
      next: (response: GetStudentFeedbackResponse) => {
        console.log('✅ Feedback response:', response);
        
        if (response.success && response.data) {
          // ✅ PERBAIKI: Response.data adalah array
          this.feedbackList = response.data.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          this.total = response.total || response.data.length;
        } else {
          this.errorMsg = response.message || 'Tidak ada feedback yang ditemukan';
          this.feedbackList = [];
          this.total = 0;
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error loading feedback:', error);
        
        let errorMessage = 'Gagal memuat data feedback. ';
        
        if (error.status === 401) {
          errorMessage += 'Sesi login telah berakhir.';
        } else if (error.status === 403) {
          errorMessage += 'Anda tidak memiliki akses.';
        } else if (error.status === 404) {
          errorMessage += 'Data feedback tidak ditemukan.';
        } else if (error.status === 0) {
          errorMessage += 'Tidak dapat terhubung ke server.';
        } else {
          errorMessage += 'Silakan coba lagi.';
        }
        
        this.errorMsg = errorMessage;
        this.feedbackList = [];
        this.total = 0;
        this.loading = false;
      }
    });
  }

  // ✅ Open add/edit feedback modal
  openAddFeedbackModal(): void {
    this.activeModal.hide();
    
    setTimeout(() => {
      const initialState = { 
        student: this.student,
        materiInfo: this.materiInfo,
        materiId: this.materiId, 
        classId: this.classId,   
        onFeedbackSent: () => {
          console.log('Feedback updated successfully');
          this.onFeedbackUpdated();
        }
      };
      
      this.modalService.show(ModalAddFeedbackComponent, { 
        class: 'modal-dialog-centered', 
        initialState 
      });
    }, 300);
  }

  onCancelClicked(): void {
    this.activeModal.hide();
  }

  // ✅ Helper methods
  getStudentName(): string {
    return this.student?.nama_siswa || 'Siswa';
  }

  getMaterialName(): string {
    return this.materiInfo?.judul_materi || 'Materi';
  }

  // ✅ TAMBAH: Get current teacher name
  getCurrentTeacherName(): string {
    // Ambil dari localStorage atau dari service jika tersedia
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    return userData.nama || 'Guru';
  }

  formatDate(date: Date | string): string {
    return this.teacherProgressService.formatDate(date);
  }

  formatFeedbackText(text: string): string {
    // Format feedback text dengan line breaks
    return (text || '').replace(/\n/g, '<br>');
  }
}
