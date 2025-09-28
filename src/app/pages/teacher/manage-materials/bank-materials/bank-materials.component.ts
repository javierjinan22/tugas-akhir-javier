import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { MaterialService, PublicMaterial, PublicMaterialsResponse, CopyMaterialResponse } from 'src/app/service/material.service';
import { ModalConnectClassToMaterialComponent } from '../modal-connect-class-to-material/modal-connect-class-to-material.component';

interface ProcessedPublicMaterial {
  _id: string;
  judul: string;
  deskripsi_singkat: string;
  kategori: string;
  header_gambar?: string;
  total_bab: number;
  total_soal: number;
  has_quiz: boolean;
  created_by: {
    nama_lengkap: string;
    username: string;
  };
  created_at: string;
}

@Component({
  selector: 'app-bank-materials',
  templateUrl: './bank-materials.component.html',
  styleUrls: ['./bank-materials.component.css']
})
export class BankMaterialsComponent implements OnInit {

  @ViewChild('searchInput') searchInputRef!: ElementRef;

  // Data arrays
  publicMaterials: PublicMaterial[] = [];
  processedMaterials: ProcessedPublicMaterial[] = [];
  filteredMateri: ProcessedPublicMaterial[] = [];

  // State management
  keyword: string = '';
  loading: boolean = false;
  errorMsg: string = '';
  token: string = '';
  copyingMaterial: { [key: string]: boolean } = {};

  // Filter options untuk ngx-select
  selectedCategory: string = 'all';
  categories = [
    { value: 'all', label: 'Semua Kategori' },
    { value: 'Cakap Digital', label: 'Cakap Digital' },
    { value: 'Aman Digital', label: 'Aman Digital' },
    { value: 'Budaya Digital', label: 'Budaya Digital' },
    { value: 'Etika Digital', label: 'Etika Digital' }
  ];

  // Pagination
  currentPage: number = 1;
  totalPages: number = 1;
  totalItems: number = 0;

  showToast = false;
  toastMessage = '';
  toastClass = '';
  toastIcon = '';
  private toastTimeout?: number;

  constructor(
    private router: Router,
    private materialService: MaterialService,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    this.token = localStorage.getItem('token') || '';

    if (this.token) {
      this.getPublicMaterials();
    } else {
      this.errorMsg = 'Token tidak ditemukan. Silakan login ulang.';
    }
  }

  getPublicMaterials() {
    this.loading = true;
    this.errorMsg = '';

    this.materialService.getPublicMaterials(this.token).subscribe({
      next: (response: PublicMaterialsResponse) => {
        console.log('✅ Public materials loaded:', response);

        if (response.success && response.data && Array.isArray(response.data)) {
          this.publicMaterials = response.data;

          // Set pagination info
          if (response.pagination) {
            this.currentPage = response.pagination.currentPage;
            this.totalPages = response.pagination.totalPages;
            this.totalItems = response.pagination.totalItems;
          }

          this.processPublicMaterials();
        } else {
          console.warn('⚠️ Unexpected response structure:', response);
          this.publicMaterials = [];
          this.processedMaterials = [];
          this.filteredMateri = [];
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error fetching public materials:', err);

        let errorMessage = 'Gagal memuat bank materi. Silakan coba lagi.';
        if (err.status === 404) {
          errorMessage = 'Belum ada materi publik yang tersedia.';
        } else if (err.status === 403) {
          errorMessage = 'Anda tidak memiliki akses untuk melihat bank materi.';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }

        this.errorMsg = errorMessage;
        this.publicMaterials = [];
        this.processedMaterials = [];
        this.filteredMateri = [];
        this.loading = false;
      }
    });
  }

  processPublicMaterials() {
    if (!this.publicMaterials || this.publicMaterials.length === 0) {
      this.processedMaterials = [];
      this.filteredMateri = [];
      return;
    }

    this.processedMaterials = this.publicMaterials.map(material => ({
      _id: material._id,
      judul: material.judul_materi,
      deskripsi_singkat: material.deskripsi_singkat,
      kategori: normalizeKategori(material.kategori_materi ?? ''), // ✅ gunakan normalisasi
      header_gambar: material.header_gambar,
      total_bab: material.total_bab || 0,
      total_soal: material.total_soal || 0,
      has_quiz: material.has_quiz || false,
      created_by: {
        nama_lengkap: material.created_by?.nama_lengkap || 'Unknown',
        username: material.created_by?.username || 'unknown'
      },
      created_at: material.created_at
    }));

    this.onSearch(); // Apply initial filter
  }

  onSearch() {
    let filtered = [...this.processedMaterials];

    // Filter by category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(materi => materi.kategori === this.selectedCategory);
    }

    // Filter by keyword
    if (this.keyword.trim()) {
      const searchTerm = this.keyword.toLowerCase();
      filtered = filtered.filter(materi =>
        materi.judul.toLowerCase().includes(searchTerm) ||
        materi.deskripsi_singkat.toLowerCase().includes(searchTerm) ||
        materi.kategori.toLowerCase().includes(searchTerm) ||
        materi.created_by.nama_lengkap.toLowerCase().includes(searchTerm)
      );
    }

    this.filteredMateri = filtered;
  }

  onCategoryChange() {
    console.log('Selected category:', this.selectedCategory);
    this.onSearch();
  }

  previewMaterial(materi: ProcessedPublicMaterial) {
    this.router.navigate(['/guru/preview-materi', materi._id]);
  }
  // Update method copyMaterial
  copyMaterial(materi: ProcessedPublicMaterial): void {
    const initialState = {
      materialData: {
        _id: materi._id,
        judul: materi.judul,
        deskripsi_singkat: materi.deskripsi_singkat,
        kategori: materi.kategori
      },
      onSuccess: (response: CopyMaterialResponse) => {
        this.handleCopySuccess(response, materi);
      },
      onError: (error: any) => {
        this.handleCopyError(error, materi);
      }
    };

    const modalRef: BsModalRef = this.modalService.show(
      ModalConnectClassToMaterialComponent,
      {
        initialState,
        class: 'modal-lg modal-dialog-centered',
        backdrop: 'static',
        keyboard: false
      }
    );
  }

  private handleCopySuccess(response: CopyMaterialResponse, materi: ProcessedPublicMaterial): void {
    if (response.success) {
      this.showSuccessToast(`Materi "${response.data.judul_materi}" berhasil disalin ke daftar materi Anda!`);
      setTimeout(() => {
        this.router.navigate(['/guru/kelola-materi']);
      }, 2000);
    } else {
      this.showErrorToast('Terjadi kesalahan saat menyalin materi. Silakan coba lagi.');
    }
  }

  private handleCopyError(error: any, materi: ProcessedPublicMaterial): void {
    let errorMessage = `Gagal menyalin materi "${materi.judul}". Silakan coba lagi.`;
    if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 409) {
      errorMessage = 'Materi ini sudah pernah disalin sebelumnya ke sekolah Anda.';
    } else if (error.status === 403) {
      errorMessage = 'Anda tidak memiliki akses untuk menyalin materi ini.';
    } else if (error.status === 404) {
      errorMessage = 'Materi tidak ditemukan atau sudah tidak tersedia.';
    } else if (error.status === 400) {
      errorMessage = 'Data materi tidak valid atau sudah tidak aktif.';
    }
    this.showErrorToast(errorMessage);
  }

  // Helper methods
  isCopying(materialId: string): boolean {
    return this.copyingMaterial[materialId] || false;
  }

  getTotalMaterialsCount(): number {
    return this.processedMaterials?.length || 0;
  }

  getFilteredMaterialsCount(): number {
    return this.filteredMateri?.length || 0;
  }

  refreshMaterials(): void {
    this.getPublicMaterials();
  }

  onSearchIconClick() {
    this.searchInputRef.nativeElement.focus();
  }

  backToManageMaterials() {
    this.router.navigate(['/guru/kelola-materi']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getCategoryClass(kategori: string): string {
    switch (kategori) {
      case 'Cakap Digital':
        return 'badge-cakap-digital';
      case 'Aman Digital':
        return 'badge-aman-digital';
      case 'Budaya Digital':
        return 'badge-budaya-digital';
      case 'Etika Digital':
        return 'badge-etika-digital';
      default:
        return 'badge-default';
    }
  }

  getCategoryIcon(kategori: string): string {
    switch (kategori) {
      case 'Cakap Digital':
        return 'fas fa-laptop';
      case 'Aman Digital':
        return 'fas fa-shield-alt';
      case 'Budaya Digital':
        return 'fas fa-users';
      case 'Etika Digital':
        return 'fas fa-balance-scale';
      default:
        return 'fas fa-book';
    }
  }

  getQuizStatusText(hasQuiz: boolean, totalSoal: number): string {
    if (!hasQuiz || totalSoal === 0) {
      return 'Tidak ada kuis';
    }
    return `${totalSoal} soal kuis`;
  }

  getQuizStatusIcon(hasQuiz: boolean): string {
    return hasQuiz ? 'fas fa-question-circle text-primary' : 'fas fa-minus-circle text-muted';
  }

  goToMyMaterials() {
    this.router.navigate(['/guru/kelola-materi']);
  }

  showSuccessToast(message: string): void {
    this.hideToast();
    setTimeout(() => {
      this.toastMessage = message;
      this.toastClass = 'toast-success';
      this.toastIcon = 'fas fa-check-circle';
      this.showToast = true;
      this.toastTimeout = window.setTimeout(() => this.hideToast(), 3000);
    }, 100);
  }

  showErrorToast(message: string): void {
    this.hideToast();
    setTimeout(() => {
      this.toastMessage = message;
      this.toastClass = 'toast-error';
      this.toastIcon = 'fas fa-exclamation-circle';
      this.showToast = true;
      this.toastTimeout = window.setTimeout(() => this.hideToast(), 4000);
    }, 100);
  }

  hideToast(): void {
    this.showToast = false;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  ngOnDestroy(): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }
}

function normalizeKategori(kategori: string): string {
  switch ((kategori || '').toLowerCase().trim()) {
    case 'cakap digital': return 'Cakap Digital';
    case 'aman digital': return 'Aman Digital';
    case 'budaya digital': return 'Budaya Digital';
    case 'etika digital': return 'Etika Digital';
    default: return 'Lainnya';
  }
}
