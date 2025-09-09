import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ModalDownloadComponent } from '../modal-download/modal-download.component';
import { StudentProgressService, MaterialSummary, MaterialCategory } from '../../../../service/student-progress.service';

@Component({
  selector: 'app-material-finished',
  templateUrl: './material-finished.component.html',
  styleUrls: ['./material-finished.component.css']
})
export class MaterialFinishedComponent implements OnInit {
  materialCategories: MaterialCategory[] = [];
  completedMaterials: MaterialSummary[] = [];
  loading: boolean = false;
  error: string = '';
  viewMode: 'category' | 'list' = 'category';

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
          this.materialCategories = this.studentProgressService.getCompletedMaterialsByCategory(response);
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

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'category' ? 'list' : 'category';
  }

  viewMaterial(material: MaterialSummary): void {
    console.log(`Viewing completed material: ${material.judul_materi}`);
    this.router.navigate(['/siswa/materi/lihat-materi', material._id]);
  }

  getCategoryIcon(categoryName: string): string {
    switch (categoryName) {
      case 'Etika Digital': return 'fa-shield-alt';
      case 'Budaya Digital': return 'fa-laptop';
      case 'Cakap Digital': return 'fa-cogs';
      case 'Keamanan Digital': return 'fa-lock';
      default: return 'fa-folder';
    }
  }

  getCategoryColor(categoryName: string): string {
    switch (categoryName) {
      case 'Etika Digital': return '#28a745';
      case 'Budaya Digital': return '#007bff';
      case 'Cakap Digital': return '#6f42c1';
      case 'Keamanan Digital': return '#dc3545';
      default: return '#6c757d';
    }
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

  getBabProgress(material: MaterialSummary): string {
    return `${material.completed_babs_count || material.total_bab} dari ${material.total_bab} bab`;
  }

  getLastAccessedText(material: MaterialSummary): string {
    if (!material.last_accessed) return '';
    
    const lastAccessed = new Date(material.last_accessed);
    const now = new Date();
    
    // Hitung perbedaan dalam milidetik
    const diffMs = now.getTime() - lastAccessed.getTime();
    
    // Konversi ke menit
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Baru saja';
    if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
    
    // Konversi ke jam
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    
    // Konversi ke hari
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    
    // Untuk lebih dari seminggu, tampilkan tanggal
    return lastAccessed.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    });
  }

  getCompletedDateText(material: MaterialSummary): string {
    if (!material.completed_at) return '';
    
    const completedDate = new Date(material.completed_at);
    return completedDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  getCompletedDate(material: MaterialSummary): Date | null {
    return material.completed_at ? new Date(material.completed_at) : null;
  }

  getQuizScore(material: MaterialSummary): number | null {
    return material.quiz_best_score || null;
  }

  canDownload(material: MaterialSummary): boolean {
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