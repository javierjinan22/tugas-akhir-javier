import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ModalDownloadComponent } from '../modal-download/modal-download.component';
import { StudentProgressService, MaterialSummary } from '../../../../service/student-progress.service';

@Component({
  selector: 'app-material-finished',
  templateUrl: './material-finished.component.html',
  styleUrls: ['./material-finished.component.css']
})
export class MaterialFinishedComponent implements OnInit {
  completedMaterials: MaterialSummary[] = [];
  loading: boolean = false;
  error: string = '';

  constructor(
    private router: Router,
    private modalService: BsModalService,
    private studentProgressService: StudentProgressService
  ) { }

  ngOnInit(): void {
    this.loadCompletedMaterials();
  }

  loadCompletedMaterials(): void {
    this.loading = true;
    this.error = '';
    
    this.studentProgressService.getMateriWithProgress().subscribe({
      next: (response) => {
        if (response.success) {
          this.completedMaterials = this.studentProgressService.getCompletedMaterials(response);
        } else {
          this.error = 'Gagal memuat materi';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading completed materials:', error);
        this.error = 'Gagal memuat materi yang sudah diselesaikan';
        this.loading = false;
      }
    });
  }

  viewMaterial(material: MaterialSummary): void {
    console.log(`Viewing completed material: ${material.judul_materi}`);
    this.router.navigate(['/siswa/materi/lihat-materi', material._id]);
  }

  downloadMaterial(material: MaterialSummary): void {
    console.log(`Opening download modal for: ${material.judul_materi}`);
    
    const initialState = {
      materialId: material._id,
      materialTitle: material.judul_materi,
      slug: material._id
    };

    const modalRef: BsModalRef = this.modalService.show(ModalDownloadComponent, {
      class: 'modal-dialog-centered',
      initialState
    });

    modalRef.onHide?.subscribe(() => {
      console.log('Download modal closed');
    });
  }

  getCompletedDate(material: MaterialSummary): Date | null {
    return material.completed_at ? new Date(material.completed_at) : null;
  }

  getQuizScore(material: MaterialSummary): number | null {
    return material.quiz_best_score || null;
  }

  // ✅ TAMBAHKAN HELPER METHODS INI DI SINI:
  
  // Helper method to check if material can be downloaded
  canDownload(material: MaterialSummary): boolean {
    // Check if download is allowed (you can adjust this logic)
    return material.flag_unduh === true || material.izinkan_unduh === 1;
  }

  // Helper method to check if material has quiz
  hasQuiz(material: MaterialSummary): boolean {
    return material.has_quiz;
  }

  // Update the existing methods to handle the correct property names:
  getQuizScoreText(material: MaterialSummary): string {
    const score = this.getQuizScore(material);
    if (!this.hasQuiz(material)) return '';
    if (score === null) return 'Kuis belum dikerjakan';
    return `Skor terbaik: ${score}`;
  }
}