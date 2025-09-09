import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MaterialService } from '../../../../service/material.service';

interface MaterialPage {
  content: string;
  isRead: boolean;
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
  isActive: boolean;
  waktuPengerjaan?: number;
}

@Component({
  selector: 'app-detail-materials',
  templateUrl: './detail-materials.component.html',
  styleUrls: ['./detail-materials.component.css']
})
export class DetailMaterialsComponent implements OnInit {
  
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
  currentQuizIndex: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    private materialService: MaterialService
  ) {}

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
        if (response.success && response.data) {
          this.processMaterialData(response.data);
        } else {
          this.errorMsg = 'Data materi tidak valid';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading material:', error);
        this.isLoading = false;
        
        if (error.status === 404) {
          this.errorMsg = 'Materi tidak ditemukan';
        } else if (error.status === 403) {
          this.errorMsg = 'Anda tidak memiliki akses untuk melihat materi ini';
        } else {
          this.errorMsg = 'Gagal memuat data materi. Silakan coba lagi.';
        }
      }
    });
  }

  processMaterialData(data: any): void {
  // Get class names
  this.materialService.getClassNamesByIds(data.kelas_ditautkan || [], this.token).subscribe({
    next: (classMap) => {
      const kelasNames = data.kelas_ditautkan?.map((classId: string) => 
        classMap[classId] || `Kelas ID: ${classId}`
      ) || [];

      // Process BAB list to pages
      const pages: MaterialPage[] = [];
      
      if (data.babList && Array.isArray(data.babList)) {
        data.babList.forEach((bab: any) => {
          if (bab.judulBab || bab.isiBab) {
            const content = `
              <h5>${bab.judulBab || 'BAB Tanpa Judul'}</h5>
              <div>${bab.isiBab || ''}</div>
            `;
            pages.push({
              content: content,
              isRead: false
            });
          }
        });
      }

      // If no pages from babList, create from isian_materi
      if (pages.length === 0 && data.isian_materi) {
        pages.push({
          content: `
            <h5>${data.judul_materi}</h5>
            <div>${data.isian_materi}</div>
          `,
          isRead: false
        });
      }

      // ✅ FIX: Get waktu_pengerjaan from root level, not from soal
      const waktuPengerjaan = data.waktu_pengerjaan || null;

      // Create processed material
      this.material = {
        id: data._id,
        title: data.judul_materi || 'Materi Tanpa Judul',
        description: data.deskripsi_singkat || '',
        kategori: data.kategori_materi || null, // ✅ TAMBAH: Kategori
        headerGambar: data.header_gambar || null, // ✅ TAMBAH: Header gambar
        pages: pages,
        progress: 100, // Set 100% untuk preview
        isRead: true, // Set true untuk preview
        quizCompleted: false,
        quizQuestions: data.soal || [],
        kelasNames: kelasNames,
        createdAt: data.created_at,
        flagUnduh: data.flag_unduh || false,
        isActive: data.is_active,
        waktuPengerjaan: waktuPengerjaan
      };

      // Load first page if material tab is active
      if (this.currentTab === 'materi' && this.material.pages.length > 0) {
        this.loadPage(0);
      }
    },
    error: (error) => {
      console.error('Error getting class names:', error);
      // Continue without class names
      this.material = {
        id: data._id,
        title: data.judul_materi || 'Materi Tanpa Judul',
        description: data.deskripsi_singkat || '',
        kategori: data.kategori_materi || null, // ✅ TAMBAH: Kategori
        headerGambar: data.header_gambar || null, // ✅ TAMBAH: Header gambar
        pages: [],
        progress: 100,
        isRead: true,
        quizCompleted: false,
        quizQuestions: data.soal || [],
        kelasNames: data.kelas_ditautkan || [],
        createdAt: data.created_at,
        flagUnduh: data.flag_unduh || false,
        isActive: data.is_active,
        waktuPengerjaan: data.waktu_pengerjaan || null // ✅ FIX: Root level waktu_pengerjaan
      };
    }
  });
}

getJenisSoalText(jenisSoal: string): string {
  switch (jenisSoal) {
    case 'pilihan_ganda':
      return 'Pilihan Ganda';
    case 'benar_salah':
      return 'Benar/Salah';
    case 'isian_singkat':
      return 'Isian Singkat';
    default:
      return jenisSoal;
  }
}

getKategoriIcon(kategori: string): string {
  switch (kategori) {
    case 'Budaya Digital':
      return 'fa-laptop';
    case 'Etika Digital':
      return 'fa-shield-alt';
    case 'Keamanan Digital':
      return 'fa-lock';
    case 'Keterampilan Digital':
      return 'fa-cogs';
    default:
      return 'fa-folder';
  }
}

  formatWaktuPengerjaan(): string {
  if (!this.material?.waktuPengerjaan) {
    return 'Tidak ditentukan';
  }
  
  const menit = this.material.waktuPengerjaan;
  if (menit < 60) {
    return `${menit} menit`;
  } else {
    const jam = Math.floor(menit / 60);
    const sisaMenit = menit % 60;
    if (sisaMenit === 0) {
      return `${jam} jam`;
    } else {
      return `${jam} jam ${sisaMenit} menit`;
    }
  }
}

  // ✅ TAB NAVIGATION METHODS
  switchTab(tab: 'materi' | 'quiz'): void {
    if (tab === 'quiz' && this.getTotalQuestions() === 0) {
      return; // Don't switch to quiz tab if no questions
    }
    
    this.currentTab = tab;
    
    if (tab === 'materi' && this.material && this.material.pages.length > 0) {
      this.loadPage(this.currentPageIndex);
    } else if (tab === 'quiz') {
      this.currentQuizIndex = 0;
    }
  }

  // ✅ MATERIAL NAVIGATION METHODS
  loadPage(pageIndex: number): void {
    if (!this.material || pageIndex < 0 || pageIndex >= this.material.pages.length) {
      return;
    }

    this.currentPageIndex = pageIndex;
    this.currentPageContent = this.sanitizer.bypassSecurityTrustHtml(
      this.material.pages[pageIndex].content
    );
    
    // Mark this page as read
    this.material.pages[pageIndex].isRead = true;
  }

  nextPage(): void {
    if (!this.material) return;
    
    if (this.currentPageIndex < this.material.pages.length - 1) {
      this.loadPage(this.currentPageIndex + 1);
    }
  }

  previousPage(): void {
    if (this.currentPageIndex > 0) {
      this.loadPage(this.currentPageIndex - 1);
    }
  }

  // ✅ QUIZ NAVIGATION METHODS
  nextQuestion(): void {
    if (!this.material || !this.material.quizQuestions) return;
    
    if (this.currentQuizIndex < this.material.quizQuestions.length - 1) {
      this.currentQuizIndex++;
    }
  }

  previousQuestion(): void {
    if (this.currentQuizIndex > 0) {
      this.currentQuizIndex--;
    }
  }

  getCurrentQuestion(): any {
    if (!this.material || !this.material.quizQuestions || this.material.quizQuestions.length === 0) {
      return null;
    }
    return this.material.quizQuestions[this.currentQuizIndex];
  }

  getQuestionNumber(): number {
    return this.currentQuizIndex + 1;
  }

  getTotalQuestions(): number {
    return this.material?.quizQuestions?.length || 0;
  }

  // ✅ UTILITY METHODS
  backToManageMaterials(): void {
    this.router.navigate(['/guru/kelola-materi']);
  }

  editMaterial(): void {
    if (this.material) {
      this.router.navigate(['/guru/kelola-materi/edit-materi', this.material.id]);
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  getStatusText(): string {
    return this.material?.isActive ? 'Aktif' : 'Tidak Aktif';
  }

  getStatusClass(): string {
    return this.material?.isActive ? 'status-active' : 'status-inactive';
  }
}
