import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { faExclamation, faUndo, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { ClassService } from 'src/app/service/class.service';

@Component({
  selector: 'app-modal-restore-class',
  templateUrl: './modal-restore-class.component.html',
  styleUrls: ['./modal-restore-class.component.css']
})
export class ModalRestoreClassComponent implements OnInit {

  // FontAwesome icons
  faExclamation = faExclamation; // Icon warning untuk header modal
  faUndo = faUndo;              // Icon restore untuk action button
  faSpinner = faSpinner;        // Icon loading

  // Data dari parent component
  classData: any = null;
  
  // State management
  isRestoring: boolean = false;
  
  // Callback function
  onRestoreSuccess?: () => void;
  onRestoreError?: (error: any) => void;

  constructor(
    public bsModalRef: BsModalRef,
    private classService: ClassService
  ) { }

  ngOnInit(): void {
  }

  restoreClass(): void {
    if (this.isRestoring) {
      return;
    }

    this.isRestoring = true;
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('No token found');
      this.isRestoring = false;
      
      if (this.onRestoreError) {
        this.onRestoreError({ message: 'Token tidak ditemukan. Silakan login ulang.' });
      }
      return;
    }

    if (!this.classData?._id) {
      console.error('Invalid class data');
      this.isRestoring = false;
      
      if (this.onRestoreError) {
        this.onRestoreError({ message: 'Data kelas tidak valid.' });
      }
      return;
    }

    // Call API to restore class
    this.classService.restoreClass(this.classData._id, token).subscribe({
      next: (response) => {
        
        this.isRestoring = false;
        
        // Call success callback (tanpa alert)
        if (this.onRestoreSuccess) {
          this.onRestoreSuccess();
        }
        
        // Close modal
        this.bsModalRef.hide();
      },
      error: (error) => {
        console.error('❌ Error restoring class:', error);
        
        this.isRestoring = false;
        
        // Prepare error message untuk callback
        let errorMessage = `Gagal memulihkan kelas "${this.classData.nama_kelas}". Silakan coba lagi.`;
        
        if (error.status === 403) {
          errorMessage = 'Anda tidak memiliki akses untuk memulihkan kelas ini.';
        } else if (error.status === 404) {
          errorMessage = 'Kelas tidak ditemukan atau sudah dipulihkan.';
        } else if (error.status === 409) {
          errorMessage = 'Kelas sudah dalam status aktif.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        // Call error callback (tanpa alert)
        if (this.onRestoreError) {
          this.onRestoreError({ 
            ...error, 
            message: errorMessage,
            className: this.classData.nama_kelas 
          });
        }
        
        // Close modal setelah error
        this.bsModalRef.hide();
      }
    });
  }

  cancelAction(): void {
    if (this.isRestoring) {
      return;
    }
    this.bsModalRef.hide();
  }

  // Helper method untuk format tanggal arsip
  getArchivedDate(archivedAt: string): string {
    if (!archivedAt) return '-';
    
    try {
      const date = new Date(archivedAt);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return archivedAt;
    }
  }
}
