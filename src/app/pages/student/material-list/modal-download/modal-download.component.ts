import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { faExclamation, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef } from 'ngx-bootstrap/modal';

export interface DownloadOptions {
  materialId: number;
  materialTitle: string;
  slug: string;
}

@Component({
  selector: 'app-modal-download',
  templateUrl: './modal-download.component.html',
  styleUrls: ['./modal-download.component.css']
})
export class ModalDownloadComponent implements OnInit {

  faExclamationCircle = faExclamationCircle;
  faExclamation = faExclamation;
  
  // Properties that will be passed from the parent component
  materialId!: number;
  materialTitle!: string;
  slug!: string;

  constructor(
    public activeModal: BsModalRef,
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  onCancelClicked(): void {
    this.activeModal.hide();
  }

  downloadMaterial(): void {
    console.log(`Downloading material: ${this.materialTitle}`);
    
    // In a real application, you would call your download service here
    // For now, we'll simulate the download
    this.simulateDownload('material');
    
    this.activeModal.hide();
  }

  downloadQuiz(): void {
    console.log(`Downloading quiz for: ${this.materialTitle}`);
    
    // In a real application, you would call your download service here
    // For now, we'll simulate the download
    this.simulateDownload('quiz');
    
    this.activeModal.hide();
  }

  private simulateDownload(type: 'material' | 'quiz'): void {
    // Simulate download process
    const downloadType = type === 'material' ? 'Materi' : 'Kuis';
    
    // Show loading state (you could add a loading spinner here)
    const loadingMessage = `Memulai download ${downloadType}...`;
    console.log(loadingMessage);
    
    // Simulate download completion
    setTimeout(() => {
      const successMessage = `${downloadType} "${this.materialTitle}" berhasil diunduh!`;
      alert(successMessage);
      
      // In a real app, you would:
      // 1. Call your API endpoint
      // 2. Handle the file download
      // 3. Show success/error notifications
      // 
      // Example API call structure:
      // this.downloadService.downloadFile({
      //   materialId: this.materialId,
      //   type: type,
      //   slug: this.slug
      // }).subscribe({
      //   next: (blob) => {
      //     // Handle file download
      //     this.handleFileDownload(blob, `${this.materialTitle}_${type}.pdf`);
      //   },
      //   error: (error) => {
      //     console.error('Download failed:', error);
      //     alert('Download gagal. Silakan coba lagi.');
      //   }
      // });
      
    }, 1000);
  }

  // Future method for handling actual file downloads
  private handleFileDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
