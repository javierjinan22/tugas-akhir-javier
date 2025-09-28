import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { faExclamation, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { StudentProgressService } from '../../../../service/student-progress.service';
import { TeacherProgressService } from '../../../../service/teacher-progress.service';

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
  
  // Toast properties
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

  private userRole: string = '';

  constructor(
    public activeModal: BsModalRef,
    private router: Router,
    private studentProgressService: StudentProgressService,
    private teacherProgressService: TeacherProgressService
  ) { }

  ngOnInit(): void {
    this.userRole = this.detectUserRole();

    console.log('Modal download opened for:', {
      materialId: this.materialId,
      materialTitle: this.materialTitle,
      attemptId: this.attemptId
    });
  }

  ngOnDestroy(): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  private detectUserRole(): string {
    const currentRoute = this.router.url;
    if (currentRoute.includes('/guru/')) {
      return 'guru';
    } else if (currentRoute.includes('/siswa/')) {
      return 'siswa';
    } else {
      // Fallback: cek dari localStorage atau token
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.role || 'siswa';
        } catch (error) {
          console.error('Error parsing token:', error);
        }
      }
      return 'siswa';
    }
  }

  onCancelClicked(): void {
    this.activeModal.hide();
  }

  // ✅ Download materi PDF
  // downloadMaterial(): void {
  //   if (this.isDownloadingMaterial) return;
    
  //   console.log(`Starting download material: ${this.materialTitle}`);
  //   this.isDownloadingMaterial = true;
    
  //   this.studentProgressService.downloadMaterialPdf(this.materialId).subscribe({
  //     next: (blob: Blob) => {
  //       const filename = `${this.sanitizeFilename(this.materialTitle)}_materi.pdf`;
  //       this.studentProgressService.downloadFile(blob, filename);
        
  //       this.showSuccessToast(`Materi "${this.materialTitle}" berhasil diunduh!`);
  //       this.isDownloadingMaterial = false;
        
  //       // ✅ Tutup modal setelah toast hilang
  //       setTimeout(() => {
  //         this.activeModal.hide();
  //       }, 3500);
  //     },
  //     error: (error) => {
  //       console.error('Error downloading material:', error);
  //       this.showErrorToast('Gagal mengunduh materi. Silakan coba lagi.');
  //       this.isDownloadingMaterial = false;
  //     }
  //   });
  // }

  downloadMaterial(): void {
    if (this.isDownloadingMaterial) return;
    
    console.log(`Starting download material: ${this.materialTitle} (Role: ${this.userRole})`);
    this.isDownloadingMaterial = true;
    
    const downloadService = this.userRole === 'guru' ? 
      this.teacherProgressService : 
      this.studentProgressService;

    this.studentProgressService.downloadMaterialPdf(this.materialId).subscribe({
      next: (blob: Blob) => {
        const filename = `${this.sanitizeFilename(this.materialTitle)}_materi.pdf`;
        this.studentProgressService.downloadFile(blob, filename);
        
        this.showSuccessToast(`Materi "${this.materialTitle}" berhasil diunduh!`);
        this.isDownloadingMaterial = false;
        
        setTimeout(() => {
          this.activeModal.hide();
        }, 3500);
      },
      error: async(error) => {
        console.error('Error downloading material:', error);
        const errorMessage = await this.getErrorMessage(error);
        this.showErrorToast(errorMessage);
        this.isDownloadingMaterial = false;
      }
    });
  }

  // ✅ Download quiz PDF
  // downloadQuiz(): void {
  //   if (this.isDownloadingQuiz) return;
    
  //   console.log(`Starting download quiz: ${this.materialTitle}`);
  //   this.isDownloadingQuiz = true;
    
  //   this.studentProgressService.downloadQuizPdf(this.materialId).subscribe({
  //     next: (blob: Blob) => {
  //       const filename = `${this.sanitizeFilename(this.materialTitle)}_kuis.pdf`;
  //       this.studentProgressService.downloadFile(blob, filename);
        
  //       this.showSuccessToast(`Kuis "${this.materialTitle}" berhasil diunduh!`);
  //       this.isDownloadingQuiz = false;
        
  //       // ✅ Tutup modal setelah toast hilang
  //       setTimeout(() => {
  //         this.activeModal.hide();
  //       }, 3500);
  //     },
  //     error: (error) => {
  //       console.error('Error downloading quiz:', error);
  //       this.showErrorToast('Gagal mengunduh kuis. Silakan coba lagi.');
  //       this.isDownloadingQuiz = false;
  //     }
  //   });
  // }

  downloadQuiz(): void {
    if (this.isDownloadingQuiz) return;
    
    console.log(`Starting download quiz: ${this.materialTitle} (Role: ${this.userRole})`);
    this.isDownloadingQuiz = true;
    
    this.studentProgressService.downloadQuizPdf(this.materialId).subscribe({
      next: (blob: Blob) => {
        const filename = `${this.sanitizeFilename(this.materialTitle)}_kuis.pdf`;
        this.studentProgressService.downloadFile(blob, filename);
        
        this.showSuccessToast(`Kuis "${this.materialTitle}" berhasil diunduh!`);
        this.isDownloadingQuiz = false;
        
        setTimeout(() => {
          this.activeModal.hide();
        }, 3500);
      },
      error: async (error) => {
        console.error('Error downloading quiz:', error);
        const errorMessage = await this.getErrorMessage(error);
        this.showErrorToast(errorMessage);
        this.isDownloadingQuiz = false;
      }
    });
  }

  // Download hasil attempt quiz PDF
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
        
        // Tutup modal setelah toast hilang
        setTimeout(() => {
          this.activeModal.hide();
        }, 3500);
      },
      error: async (error) => {
        console.error('Error downloading quiz attempt:', error);
        const errorMessage = await this.getErrorMessage(error);
        this.showErrorToast(errorMessage);
        this.isDownloadingQuizAttempt = false;
      }
    });
  }

  private async getErrorMessage(error: any): Promise<string> {
  console.log('Full error object:', error);

  // Jika error.error adalah Blob (karena responseType: 'blob')
  if (error.error instanceof Blob) {
    try {
      const text = await error.error.text();
      const parsed = JSON.parse(text);
      if (parsed.message) {
        return parsed.message;
      }
      return text;
    } catch {
      return 'Gagal mengunduh file. Silakan coba lagi.';
    }
  }

  // Cek apakah ada response dari backend
  if (error.error) {
    if (error.error.message) {
      return error.error.message;
    }
    if (typeof error.error === 'string') {
      try {
        const parsed = JSON.parse(error.error);
        if (parsed.message) {
          return parsed.message;
        }
      } catch {
        return error.error;
      }
    }
  }

  // Fallback berdasarkan status code
  switch (error.status) {
    case 403:
      return 'Materi ini tidak dapat diunduh atau Anda tidak memiliki akses';
    case 404:
      return 'Materi tidak ditemukan atau tidak memiliki konten yang dapat diunduh';
    case 401:
      return 'Sesi Anda telah berakhir. Silakan login ulang';
    case 500:
      return 'Terjadi kesalahan server. Silakan coba lagi nanti';
    case 413:
      return 'Ukuran file terlalu besar untuk diunduh';
    case 429:
      return 'Terlalu banyak permintaan. Silakan tunggu sebentar';
    case 0:
      return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda';
    default:
      return `Gagal mengunduh file. Kode error: ${error.status || 'Unknown'}`;
  }
}

  // private getErrorMessage(error: any): string {
  //   console.log('Full error object:', error);
    
  //   // Cek apakah ada response dari backend
  //   if (error.error) {
  //     // Jika ada message dari backend
  //     if (error.error.message) {
  //       return error.error.message;
  //     }
      
  //     // Jika error berbentuk string
  //     if (typeof error.error === 'string') {
  //       try {
  //         const parsed = JSON.parse(error.error);
  //         if (parsed.message) {
  //           return parsed.message;
  //         }
  //       } catch (parseError) {
  //         return error.error;
  //       }
  //     }
  //   }
    
  //   // Fallback berdasarkan status code
  //   switch (error.status) {
  //     case 403:
  //       return 'Materi ini tidak dapat diunduh atau Anda tidak memiliki akses';
  //     case 404:
  //       return 'Materi tidak ditemukan atau tidak memiliki konten yang dapat diunduh';
  //     case 401:
  //       return 'Sesi Anda telah berakhir. Silakan login ulang';
  //     case 500:
  //       return 'Terjadi kesalahan server. Silakan coba lagi nanti';
  //     case 413:
  //       return 'Ukuran file terlalu besar untuk diunduh';
  //     case 429:
  //       return 'Terlalu banyak permintaan. Silakan tunggu sebentar';
  //     case 0:
  //       return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda';
  //     default:
  //       return `Gagal mengunduh file. Kode error: ${error.status || 'Unknown'}`;
  //   }
  // }

  // Toast methods dengan warna custom
  private showSuccessToast(message: string): void {
    this.toastMessage = message;
    this.toastClass = 'toast-success';
    this.toastIcon = 'fas fa-check-circle';
    this.showToast = true;
    
    // Auto hide setelah 3 detik
    this.toastTimeout = window.setTimeout(() => {
      this.hideToast();
    }, 3000);
  }

  private showErrorToast(message: string): void {
    this.toastMessage = message;
    this.toastClass = 'toast-error';
    this.toastIcon = 'fas fa-exclamation-circle';
    this.showToast = true;
    
    // Auto hide setelah 4 detik untuk error (lebih lama)
    this.toastTimeout = window.setTimeout(() => {
      this.hideToast();
    }, 4000);
  }

  // Method untuk hide toast manual
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
