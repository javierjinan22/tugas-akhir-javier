import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { SchoolRanking } from 'src/app/service/ranking.service';

@Component({
  selector: 'app-modal-detail-top-school',
  templateUrl: './modal-detail-top-school.component.html',
  styleUrls: ['./modal-detail-top-school.component.css']
})
export class ModalDetailTopSchoolComponent implements OnInit {

  // ✅ Data yang akan diterima dari parent
  schoolData: SchoolRanking | null = null;

  constructor(
    public bsModalRef: BsModalRef
  ) { }

  ngOnInit(): void {
    console.log('🏫 School detail modal initialized with data:', this.schoolData);
  }

  // ✅ Get formatted address
  getFullAddress(): string {
    if (!this.schoolData || !this.schoolData.lokasi) {
      return 'Alamat tidak tersedia';
    }

    const lokasi = this.schoolData.lokasi;
    const parts = [
      lokasi.alamat_jalan,
      lokasi.kecamatan,
      lokasi.kabupaten_kota,
      lokasi.propinsi
    ].filter(part => part && part.trim() !== '');

    return parts.length > 0 ? parts.join(', ') : 'Alamat tidak tersedia';
  }

  // ✅ Get rank badge class
  getRankBadgeClass(): string {
    if (!this.schoolData) return 'rank-badge-default';
    
    switch (this.schoolData.peringkat) {
      case 1: return 'rank-badge-gold';
      case 2: return 'rank-badge-silver';
      case 3: return 'rank-badge-bronze';
      default: return 'rank-badge-default';
    }
  }

  // ✅ GANTI: Emoji dengan path gambar asset
  getRankImage(): string {
    if (!this.schoolData) return 'assets/img/3rd-ranking.png';
    
    switch (this.schoolData.peringkat) {
      case 1: return 'assets/img/1st-ranking.png';
      case 2: return 'assets/img/2nd-ranking.png';
      case 3: return 'assets/img/3rd-ranking.png';
      default: return 'assets/img/3rd-ranking.png';
    }
  }

  // ✅ Get progress color class
  getProgressColorClass(): string {
    if (!this.schoolData) return 'progress-default';
    
    const avgCompletion = this.schoolData.statistik.avg_penyelesaian;
    if (avgCompletion >= 80) return 'progress-excellent';
    if (avgCompletion >= 60) return 'progress-good';
    if (avgCompletion >= 40) return 'progress-fair';
    return 'progress-low';
  }

  // ✅ Get performance level text
  getPerformanceLevel(): string {
    if (!this.schoolData) return 'Tidak diketahui';
    
    const avgCompletion = this.schoolData.statistik.avg_penyelesaian;
    if (avgCompletion >= 80) return 'Sangat Aktif';
    if (avgCompletion >= 60) return 'Aktif';
    if (avgCompletion >= 40) return 'Cukup Aktif';
    return 'Perlu Peningkatan';
  }

  // ✅ Close modal
  closeModal(): void {
    this.bsModalRef.hide();
  }
}
