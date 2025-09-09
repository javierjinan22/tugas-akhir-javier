import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { faExclamation, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { StudentProgressService } from '../../../../service/student-progress.service';

export interface DownloadOptions {
  materialId: string;
  materialTitle: string;
  slug: string;
  attemptId?: string;
}

@Component({
  selector: 'app-modal-download',
  templateUrl: './modal-download.component.html',
  styleUrls: ['./modal-download.component.css']
})
export class ModalDownloadComponent implements OnInit, OnDestroy {

  faExclamationCircle = faExclamationCircle;
  faExclamation = faExclamation;
  
  // Loading states
  isDownloadingMaterial = false;
  isDownloadingQuiz = false;
  isDownloadingQuizAttempt = false;
  
  // ✅ TAMBAH: Toast properties
  showToast = false;
  toastMessage = '';
  toastClass = '';
  toastIcon = '';
  private toastTimeout?: number;
  
  // Properties that will be passed from the parent component
  materialId!: string;
  materialTitle!: string;
  slug!: string;
  attemptId?: string;

  constructor(
    public activeModal: BsModalRef,
    private router: Router,
    private studentProgressService: StudentProgressService
  ) { }

  ngOnInit(): void {
    console.log('Modal download opened for:', {
      materialId: this.materialId,
      materialTitle: this.materialTitle,
      attemptId: this.attemptId
    });
  }

  ngOnDestroy(): void {
    // ✅ Clear timeout saat component destroy
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  onCancelClicked(): void {
    this.activeModal.hide();
  }

  // ✅ Download materi PDF
  downloadMaterial(): void {
    if (this.isDownloadingMaterial) return;
    
    console.log(`Starting download material: ${this.materialTitle}`);
    this.isDownloadingMaterial = true;
    
    this.studentProgressService.downloadMaterialPdf(this.materialId).subscribe({
      next: (blob: Blob) => {
        const filename = `${this.sanitizeFilename(this.materialTitle)}_materi.pdf`;
        this.studentProgressService.downloadFile(blob, filename);
        
        this.showSuccessToast(`Materi "${this.materialTitle}" berhasil diunduh!`);
        this.isDownloadingMaterial = false;
        
        // ✅ Tutup modal setelah toast hilang
        setTimeout(() => {
          this.activeModal.hide();
        }, 3500);
      },
      error: (error) => {
        console.error('Error downloading material:', error);
        this.showErrorToast('Gagal mengunduh materi. Silakan coba lagi.');
        this.isDownloadingMaterial = false;
      }
    });
  }

  // ✅ Download quiz PDF
  downloadQuiz(): void {
    if (this.isDownloadingQuiz) return;
    
    console.log(`Starting download quiz: ${this.materialTitle}`);
    this.isDownloadingQuiz = true;
    
    this.studentProgressService.downloadQuizPdf(this.materialId).subscribe({
      next: (blob: Blob) => {
        const filename = `${this.sanitizeFilename(this.materialTitle)}_kuis.pdf`;
        this.studentProgressService.downloadFile(blob, filename);
        
        this.showSuccessToast(`Kuis "${this.materialTitle}" berhasil diunduh!`);
        this.isDownloadingQuiz = false;
        
        // ✅ Tutup modal setelah toast hilang
        setTimeout(() => {
          this.activeModal.hide();
        }, 3500);
      },
      error: (error) => {
        console.error('Error downloading quiz:', error);
        this.showErrorToast('Gagal mengunduh kuis. Silakan coba lagi.');
        this.isDownloadingQuiz = false;
      }
    });
  }

  // ✅ Download hasil attempt quiz PDF
  downloadQuizAttempt(): void {
    if (!this.attemptId) {
      this.showErrorToast('ID attempt tidak ditemukan');
      return;
    }
    
    if (this.isDownloadingQuizAttempt) return;
    
    console.log(`Starting download quiz attempt: ${this.attemptId}`);
    this.isDownloadingQuizAttempt = true;
    
    this.studentProgressService.downloadQuizAttemptPdf(this.materialId, this.attemptId).subscribe({
      next: (blob: Blob) => {
        const filename = `${this.sanitizeFilename(this.materialTitle)}_hasil_kuis.pdf`;
        this.studentProgressService.downloadFile(blob, filename);
        
        this.showSuccessToast(`Hasil kuis "${this.materialTitle}" berhasil diunduh!`);
        this.isDownloadingQuizAttempt = false;
        
        // ✅ Tutup modal setelah toast hilang
        setTimeout(() => {
          this.activeModal.hide();
        }, 3500);
      },
      error: (error) => {
        console.error('Error downloading quiz attempt:', error);
        this.showErrorToast('Gagal mengunduh hasil kuis. Silakan coba lagi.');
        this.isDownloadingQuizAttempt = false;
      }
    });
  }

  // ✅ TAMBAH: Toast methods dengan warna custom
  private showSuccessToast(message: string): void {
    this.toastMessage = message;
    this.toastClass = 'toast-success';
    this.toastIcon = 'fas fa-check-circle';
    this.showToast = true;
    
    // ✅ Auto hide setelah 3 detik
    this.toastTimeout = window.setTimeout(() => {
      this.hideToast();
    }, 3000);
  }

  private showErrorToast(message: string): void {
    this.toastMessage = message;
    this.toastClass = 'toast-error';
    this.toastIcon = 'fas fa-exclamation-circle';
    this.showToast = true;
    
    // ✅ Auto hide setelah 4 detik untuk error (lebih lama)
    this.toastTimeout = window.setTimeout(() => {
      this.hideToast();
    }, 4000);
  }

  // ✅ TAMBAH: Method untuk hide toast manual
  hideToast(): void {
    this.showToast = false;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  // Helper methods
  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  // Method untuk cek loading state
  isLoading(): boolean {
    return this.isDownloadingMaterial || this.isDownloadingQuiz || this.isDownloadingQuizAttempt;
  }

  // Method untuk cek apakah memiliki attempt ID
  hasAttemptId(): boolean {
    return !!this.attemptId;
  }
}
