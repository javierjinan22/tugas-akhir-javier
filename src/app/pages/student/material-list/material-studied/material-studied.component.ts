import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ModalDownloadComponent } from '../modal-download/modal-download.component';
import { StudentProgressService, MaterialSummary } from '../../../../service/student-progress.service';

@Component({
  selector: 'app-material-studied',
  templateUrl: './material-studied.component.html',
  styleUrls: ['./material-studied.component.css']
})
export class MaterialStudiedComponent implements OnInit {
  studiedMaterials: MaterialSummary[] = [];
  loading: boolean = false;
  error: string = '';

  constructor(
    private router: Router,
    private modalService: BsModalService,
    private studentProgressService: StudentProgressService
  ) { }

  ngOnInit(): void {
    this.loadStudiedMaterials();
  }

  loadStudiedMaterials(): void {
    this.loading = true;
    this.error = '';
    
    this.studentProgressService.getMateriWithProgress().subscribe({
      next: (response) => {
        if (response.success) {
          // ✅ UPDATED: Ambil materi yang sedang dipelajari (not_started + in_progress)
          this.studiedMaterials = this.studentProgressService.getStudiedMaterials(response);
        } else {
          this.error = 'Gagal memuat materi';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading studied materials:', error);
        this.error = 'Gagal memuat materi yang sedang dipelajari';
        this.loading = false;
      }
    });
  }

  viewMaterial(material: MaterialSummary): void {
    console.log(`Viewing material: ${material.judul_materi}`);
    
    // Navigate to material detail dengan ID
    this.router.navigate(['/siswa/materi/lihat-materi', material._id]);
  }

  // ✅ TAMBAH: Helper methods untuk download
  canDownload(material: MaterialSummary): boolean {
    return material.flag_unduh === true || material.izinkan_unduh === 1;
  }

  // ✅ PASTIKAN: Method downloadMaterial sudah ada
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

  // ✅ UPDATED: Progress percentage calculation
  getProgressPercentage(material: MaterialSummary): number {
    if (material.total_bab === 0) return 0;
    return Math.round((material.completed_babs_count / material.total_bab) * 100);
  }

  getStatusText(material: MaterialSummary): string {
    switch (material.status) {
      case 'in_progress':
        return 'Sedang dipelajari';
      case 'completed':
        return 'Selesai';
      case 'not_started':
        return 'Belum dimulai';
      default:
        return 'Belum dimulai';
    }
  }

  // Helper methods
  getBabProgress(material: MaterialSummary): string {
    return `${material.completed_babs_count} dari ${material.total_bab} bab`;
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

  hasQuiz(material: MaterialSummary): boolean {
    return material.has_quiz;
  }
}
