import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CopyMaterialResponse, MaterialService } from 'src/app/service/material.service';
import { ModalConnectClassToMaterialComponent } from '../modal-connect-class-to-material/modal-connect-class-to-material.component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

interface MaterialPage {
  content: string;
  isRead: boolean;
  judulBab?: string; // ✅ TAMBAH: untuk judul BAB
}

interface ProcessedMaterial {
  id: string;
  title: string;
  description: string;
  kategori?: string;
  headerGambar?: string;
  pages: MaterialPage[];
  progress: number;
  isRead: boolean;
  quizCompleted: boolean;
  quizQuestions: any[];
  kelasNames: string[];
  createdAt: string;
  flagUnduh: boolean;
  flagAkses: number; // ✅ UBAH: dari boolean ke number sesuai response
  isActive: boolean;
  waktuPengerjaan?: number;
  totalBab: number; // ✅ TAMBAH
  totalSoal: number; // ✅ TAMBAH
  hasQuiz: boolean; // ✅ TAMBAH
  createdBy?: {
    nama_lengkap: string;
    username: string;
  };
  accessInfo?: { // ✅ TAMBAH
    is_owner: boolean;
    is_public: boolean;
    can_edit: boolean;
    can_copy: boolean;
  };
}

@Component({
  selector: 'app-preview-materials',
  templateUrl: './preview-materials.component.html',
  styleUrls: ['./preview-materials.component.css']
})
export class PreviewMaterialsComponent implements OnInit {

  material: ProcessedMaterial | null = null;
  currentPageIndex: number = 0;
  currentPageContent!: SafeHtml;

  // State management
  isLoading: boolean = true;
  errorMsg: string = '';
  token: string = '';
  materialId: string = '';

  // Tab management
  currentTab: 'materi' | 'quiz' = 'materi';

  // Quiz navigation
  currentQuizIndex: number = 0;
  showToast = false;
  toastMessage = '';
  toastClass = '';
  toastIcon = '';
  private toastTimeout?: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private materialService: MaterialService,
    private sanitizer: DomSanitizer,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    this.token = localStorage.getItem('token') || '';
    this.materialId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.materialId) {
      this.errorMsg = 'ID materi tidak ditemukan';
      this.isLoading = false;
      return;
    }

    if (!this.token) {
      this.errorMsg = 'Token tidak ditemukan. Silakan login ulang.';
      this.isLoading = false;
      return;
    }

    this.loadMaterialData();
  }

  loadMaterialData(): void {
    this.isLoading = true;
    this.errorMsg = '';

    this.materialService.getMaterialById(this.materialId, this.token).subscribe({
      next: (response) => {
        console.log('✅ Material data loaded:', response);

        if (response.success && response.data) {
          this.material = this.processMaterialData(response.data);

          // Set initial content
          if (this.material.pages.length > 0) {
            this.updateCurrentPageContent();
          }

          console.log('✅ Processed material:', this.material);
        } else {
          this.errorMsg = 'Data materi tidak ditemukan atau tidak valid';
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading material:', error);

        let errorMessage = 'Gagal memuat data materi. Silakan coba lagi.';
        if (error.status === 404) {
          errorMessage = 'Materi tidak ditemukan atau sudah tidak tersedia.';
        } else if (error.status === 403) {
          errorMessage = 'Anda tidak memiliki akses untuk melihat materi ini.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        this.errorMsg = errorMessage;
        this.isLoading = false;
      }
    });
  }

  processMaterialData(rawData: any): ProcessedMaterial {
    // ✅ PERBAIKI: Process pages from babList instead of isian_materi
    let pages: MaterialPage[] = [];
    if (rawData.babList && Array.isArray(rawData.babList)) {
      pages = rawData.babList.map((bab: any) => ({
        content: bab.isiBab || '<p>Konten BAB kosong</p>',
        isRead: false,
        judulBab: bab.judulBab || 'BAB tanpa judul'
      }));
    } else if (rawData.isian_materi) {
      // Fallback untuk format lama
      pages = [{
        content: rawData.isian_materi,
        isRead: false
      }];
    }

    // Process quiz questions
    const quizQuestions = rawData.soal || [];

    return {
      id: rawData._id,
      title: rawData.judul_materi || 'Judul tidak tersedia',
      description: rawData.deskripsi_singkat || '',
      kategori: rawData.kategori_materi,
      headerGambar: rawData.header_gambar,
      pages: pages,
      progress: 0,
      isRead: false,
      quizCompleted: false,
      quizQuestions: quizQuestions,
      kelasNames: rawData.kelas_names || [], // Bisa jadi kosong untuk public materials
      createdAt: rawData.created_at,
      flagUnduh: rawData.flag_unduh || false,
      flagAkses: rawData.flag_akses || 0, // ✅ PERBAIKI: number instead of boolean
      isActive: rawData.is_active || false,
      waktuPengerjaan: rawData.waktu_pengerjaan,
      totalBab: rawData.total_bab || 0, // ✅ TAMBAH
      totalSoal: rawData.total_soal || 0, // ✅ TAMBAH
      hasQuiz: rawData.has_quiz || false, // ✅ TAMBAH
      createdBy: rawData.created_by ? {
        nama_lengkap: rawData.created_by.nama_lengkap || rawData.created_by.username,
        username: rawData.created_by.username
      } : undefined,
      accessInfo: rawData.access_info // ✅ TAMBAH
    };
  }

  // Tab management
  switchTab(tab: 'materi' | 'quiz'): void {
    if (tab === 'quiz' && this.getTotalQuestions() === 0) {
      return; // Don't allow switching to quiz tab if no questions
    }
    this.currentTab = tab;
  }

  // Page navigation for materi
  nextPage(): void {
    if (this.material && this.currentPageIndex < this.material.pages.length - 1) {
      this.currentPageIndex++;
      this.updateCurrentPageContent();
    }
  }

  previousPage(): void {
    if (this.currentPageIndex > 0) {
      this.currentPageIndex--;
      this.updateCurrentPageContent();
    }
  }

  updateCurrentPageContent(): void {
    if (this.material && this.material.pages[this.currentPageIndex]) {
      const content = this.material.pages[this.currentPageIndex].content;
      this.currentPageContent = this.sanitizer.bypassSecurityTrustHtml(content);
    }
  }

  // Quiz navigation
  nextQuestion(): void {
    if (this.currentQuizIndex < this.getTotalQuestions() - 1) {
      this.currentQuizIndex++;
    }
  }

  previousQuestion(): void {
    if (this.currentQuizIndex > 0) {
      this.currentQuizIndex--;
    }
  }

  getCurrentQuestion(): any {
    if (this.material && this.material.quizQuestions.length > 0) {
      return this.material.quizQuestions[this.currentQuizIndex];
    }
    return null;
  }

  getTotalQuestions(): number {
    return this.material?.quizQuestions?.length || 0;
  }

  getQuestionNumber(): number {
    return this.currentQuizIndex + 1;
  }

  // Helper methods
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  getStatusClass(): string {
    return this.material?.isActive ? 'status-active' : 'status-inactive';
  }

  getStatusText(): string {
    return this.material?.isActive ? 'Aktif' : 'Tidak Aktif';
  }

  getAccessStatusText(): string {
    if (this.material?.accessInfo?.is_public) {
      return 'Materi Publik';
    } else if (this.material?.flagAkses === 1) {
      return 'Dapat Diakses Publik';
    } else {
      return 'Materi Private';
    }
  }

  getAccessStatusIcon(): string {
    if (this.material?.accessInfo?.is_public || this.material?.flagAkses === 1) {
      return 'fas fa-globe text-success';
    } else {
      return 'fas fa-lock text-warning';
    }
  }

  getCurrentPageTitle(): string {
    if (this.material && this.material.pages[this.currentPageIndex]?.judulBab) {
      return this.material.pages[this.currentPageIndex].judulBab!;
    }
    return `Halaman ${this.currentPageIndex + 1} dari ${this.material?.pages.length || 0}`;
  }

  getKategoriIcon(kategori?: string): string {
    switch (kategori) {
      case 'Cakap Digital':
        return 'fa-laptop';
      case 'Aman Digital':
        return 'fa-shield-alt';
      case 'Budaya Digital':
        return 'fa-users';
      case 'Etika Digital':
        return 'fa-balance-scale';
      default:
        return 'fa-book';
    }
  }

  formatWaktuPengerjaan(): string {
    if (!this.material?.waktuPengerjaan) {
      return 'Tidak ditentukan';
    }
    return `${this.material.waktuPengerjaan} menit`;
  }

  getJenisSoalText(jenisSoal: string): string {
    switch (jenisSoal) {
      case 'pilihan_ganda':
        return 'Pilihan Ganda';
      case 'isian_singkat':
        return 'Isian Singkat';
      case 'benar_salah':
        return 'Benar/Salah';
      default:
        return 'Unknown';
    }
  }

  // Navigation methods
  backToBankMaterials(): void {
    this.router.navigate(['/guru/bank-materi']);
  }

  goToCopyMaterial(): void {
    if (!this.material) {
      return;
    }

    // Open modal to select classes
    const initialState = {
      materialData: {
        _id: this.material.id,
        judul: this.material.title,
        deskripsi_singkat: this.material.description,
        kategori: this.material.kategori
      },
      onSuccess: (response: CopyMaterialResponse) => {
        this.handleCopySuccess(response);
      },
      onError: (error: any) => {
        this.handleCopyError(error);
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

  private handleCopySuccess(response: CopyMaterialResponse): void {
    if (response.success) {
      this.showSuccessToast(`Materi "${response.data.judul_materi}" berhasil disalin ke daftar materi Anda!`);
      setTimeout(() => {
        this.router.navigate(['/guru/kelola-materi']);
      }, 2000);
    } else {
      this.showErrorToast('Terjadi kesalahan saat menyalin materi. Silakan coba lagi.');
    }
  }

  // private handleCopyError(error: any): void {
  //   let errorMessage = `Gagal menyalin materi "${this.material?.title}". Silakan coba lagi.`;
  //   if (error.status === 409) {
  //     errorMessage = 'Materi ini sudah pernah disalin sebelumnya ke sekolah Anda.';
  //   } else if (error.status === 403) {
  //     errorMessage = 'Anda tidak memiliki akses untuk menyalin materi ini.';
  //   } else if (error.status === 404) {
  //     errorMessage = 'Materi tidak ditemukan atau sudah tidak tersedia.';
  //   } else if (error.status === 400) {
  //     errorMessage = 'Data materi tidak valid atau sudah tidak aktif.';
  //   } else if (error.error?.message) {
  //     errorMessage = error.error.message;
  //   }
  //   this.showErrorToast(errorMessage);
  // }

  private handleCopyError(error: any): void {
    let errorMessage = `Gagal menyalin materi "${this.material?.title}". Silakan coba lagi.`;

    // Prioritaskan pesan dari response jika ada
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
