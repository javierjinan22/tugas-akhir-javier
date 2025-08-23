import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { StudentProgressService } from '../../../../service/student-progress.service';
import { Location, PlatformLocation } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-view-material',
  templateUrl: './view-material.component.html',
  styleUrls: ['./view-material.component.css']
})
export class ViewMaterialComponent implements OnInit, OnDestroy {
  material: any = null;
  quiz: any = null;
  currentPageIndex: number = 0;
  currentPageContent!: SafeHtml;
  loading: boolean = false;
  error: string = '';
  materiId: string = '';

  private hasUpdatedLastAccess = false;
  private originalUrl: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private platformLocation: PlatformLocation,
    private sanitizer: DomSanitizer,
    private studentProgressService: StudentProgressService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.materiId = params['id'];
      if (this.materiId) {
        this.originalUrl = this.router.url;
        this.loadMaterial();
        this.setupBrowserBackDetection();
      }
    });
  }

  private setupBrowserBackDetection(): void {
    // Method 1: Platform location
    this.platformLocation.onPopState(() => {
      console.log('🔙 Browser back/forward detected via PlatformLocation!');
      if (!this.hasUpdatedLastAccess) {
        this.updateLastAccessedSync();
        this.hasUpdatedLastAccess = true;
      }
    });

    // Method 2: Override history.back
    const originalBack = history.back;
    history.back = () => {
      console.log('🔙 History.back() called!');
      if (!this.hasUpdatedLastAccess) {
        this.updateLastAccessedSync();
        this.hasUpdatedLastAccess = true;
      }
      originalBack.call(history);
    };

    // Method 3: Listen to keyboard shortcuts (Alt+Left Arrow, etc.)
    document.addEventListener('keydown', (event) => {
      if (event.altKey && event.key === 'ArrowLeft') {
        console.log('🔙 Keyboard back shortcut detected!');
        if (!this.hasUpdatedLastAccess) {
          this.updateLastAccessedSync();
          this.hasUpdatedLastAccess = true;
        }
      }
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: any): void {
    console.log('Before unload detected');
    if (!this.hasUpdatedLastAccess) {
      this.updateLastAccessedSync();
      this.hasUpdatedLastAccess = true;
    }
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event: PopStateEvent): void {
    console.log('PopState event detected directly:', event);
    if (!this.hasUpdatedLastAccess) {
      this.updateLastAccessedSync();
      this.hasUpdatedLastAccess = true;
    }
  }

  @HostListener('document:visibilitychange', ['$event'])
  onVisibilityChange(): void {
    if (document.hidden && !this.hasUpdatedLastAccess) {
      console.log('Page hidden detected');
      this.updateLastAccessedSync();
      this.hasUpdatedLastAccess = true;
    }
  }

  ngOnDestroy(): void {
    console.log('Component destroyed');
    if (!this.hasUpdatedLastAccess) {
      this.updateLastAccessedSync();
      this.hasUpdatedLastAccess = true;
    }
  }

  loadMaterial(): void {
    this.loading = true;
    this.error = '';

    this.studentProgressService.getMateriDetailForViewing(this.materiId).subscribe({
      next: (response) => {
        if (response.success) {
          this.material = response.data.material;
          this.quiz = response.data.quiz;

          const firstUnreadPage = this.material.pages.findIndex((page: any) => !page.isRead);
          this.loadPage(firstUnreadPage >= 0 ? firstUnreadPage : 0);
        } else {
          this.error = 'Gagal memuat materi';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading material:', error);
        this.error = 'Gagal memuat detail materi';
        this.loading = false;
      }
    });
  }

  private updateMaterialProgress(): void {
    const readPagesCount = this.material.pages.filter((page: any) => page.isRead).length;
    const totalPages = this.material.pages.length;
    const hasQuiz = this.material.hasQuiz || false;
    const quizCompleted = this.material.quizCompleted || false;

    this.material.readPages = readPagesCount;
    this.material.totalPages = totalPages;

    const allBabsCompleted = readPagesCount === totalPages;

    if (hasQuiz) {

      if (quizCompleted) {
        this.material.progress = 100;
        this.material.isRead = true;
      } else if (allBabsCompleted) {
        this.material.progress = 90;
        this.material.isRead = true;
      } else {
        this.material.progress = Math.round((readPagesCount / totalPages) * 80);
        this.material.isRead = false;
      }
    } else {
      this.material.progress = Math.round((readPagesCount / totalPages) * 100);
      this.material.isRead = allBabsCompleted;
    }
  }

  loadPage(pageIndex: number): void {
    if (!this.material || pageIndex < 0 || pageIndex >= this.material.pages.length) {
      return;
    }

    this.currentPageIndex = pageIndex;
    const currentPage = this.material.pages[pageIndex];
    this.currentPageContent = this.sanitizer.bypassSecurityTrustHtml(currentPage.content);

    if (!currentPage.isRead) {
      this.markBabAsComplete(pageIndex);
    } else {
      this.updateMaterialProgress();
    }
  }

  private markBabAsComplete(babIndex: number): void {
    this.studentProgressService.completeBab(this.materiId, babIndex).subscribe({
      next: (response) => {
        if (response.success) {
          this.material.pages[babIndex].isRead = true;

          if (response.data) {
            this.material.readPages = response.data.completed_babs_count;
            this.material.totalPages = response.data.total_babs;
            this.material.hasQuiz = response.data.quiz_required;

            this.updateProgressLogic(response.data);
          }
        }
      },
      error: (error) => {
        console.error('Error marking bab as complete:', error);
      }
    });
  }

  private updateProgressLogic(data: any): void {
    const allBabsCompleted = data.completed_babs_count === data.total_babs;
    const hasQuiz = data.quiz_required;
    const quizCompleted = this.material.quizCompleted || false;

    if (hasQuiz) {
      // ✅ Jika ada quiz
      if (quizCompleted) {
        this.material.progress = 100;
        this.material.isRead = true;
      } else if (allBabsCompleted) {
        this.material.progress = 90;
        this.material.isRead = true;
      } else {
        this.material.progress = Math.round((data.completed_babs_count / data.total_babs) * 80);
        this.material.isRead = false;
      }
    } else {
      this.material.progress = Math.round((data.completed_babs_count / data.total_babs) * 100);
      this.material.isRead = allBabsCompleted;
    }

  }

  nextPage(): void {
    if (this.currentPageIndex < this.material.pages.length - 1) {
      this.loadPage(this.currentPageIndex + 1);
    }
  }

  previousPage(): void {
    if (this.currentPageIndex > 0) {
      this.loadPage(this.currentPageIndex - 1);
    }
  }

  // ✅ TAMBAH: Method untuk cek apakah bisa ambil quiz
  // canTakeQuiz(): boolean {
  //   const allBabsRead = this.material?.readPages === this.material?.totalPages;
  //   const hasQuiz = this.material?.hasQuiz;
  //   const quizCompleted = this.material?.quizCompleted;

  //   return allBabsRead && hasQuiz && !quizCompleted;
  // }

  canTakeQuiz(): boolean {
    const allBabsRead = this.material?.readPages === this.material?.totalPages;
    const hasQuiz = this.material?.hasQuiz;

    return allBabsRead && hasQuiz;
  }

  canStartNewQuiz(): boolean {
    const allBabsRead = this.material?.readPages === this.material?.totalPages;
    const hasQuiz = this.material?.hasQuiz;
    const quizCompleted = this.material?.quizCompleted;

    return allBabsRead && hasQuiz && !quizCompleted;
  }

  // ✅ UPDATE: Method takeQuiz
  takeQuiz(): void {
    const allBabsRead = this.material?.readPages === this.material?.totalPages;
    const hasQuiz = this.material?.hasQuiz;

    if (allBabsRead && hasQuiz) {
      // Navigate ke take-quiz component (bisa untuk quiz baru atau lihat riwayat)
      this.router.navigate(['/siswa/materi/lihat-materi', this.materiId, 'kuis']);
    }
  }

  isAllPagesRead(): boolean {
    const allBabsRead = this.material?.readPages === this.material?.totalPages;
    const hasQuiz = this.material?.hasQuiz;
    const quizCompleted = this.material?.quizCompleted;

    if (hasQuiz) {
      // ✅ Jika ada quiz: harus semua bab dibaca DAN quiz selesai
      return allBabsRead && quizCompleted;
    } else {
      // ✅ Jika tidak ada quiz: cukup semua bab dibaca
      return allBabsRead;
    }
  }

  getCurrentPageTitle(): string {
    return this.material?.pages[this.currentPageIndex]?.title || '';
  }

  // ✅ TAMBAH: Helper method untuk status completion
  getCompletionStatus(): string {
    if (!this.material) return '';

    const allBabsRead = this.material.readPages === this.material.totalPages;
    const hasQuiz = this.material.hasQuiz;
    const quizCompleted = this.material.quizCompleted;

    if (hasQuiz) {
      if (quizCompleted) return 'Selesai (dengan quiz)';
      if (allBabsRead) return 'Materi selesai, quiz belum';
      return `${this.material.readPages}/${this.material.totalPages} bab`;
    }

    return allBabsRead ? 'Selesai' : `${this.material.readPages}/${this.material.totalPages} bab`;
  }

  // ✅ UPDATE: Method untuk progress dengan quiz logic
  getProgressPercentage(): number {
    if (!this.material) return 0;

    const hasQuiz = this.material.hasQuiz;
    const quizCompleted = this.material.quizCompleted;
    const readPages = this.material.readPages || 0;
    const totalPages = this.material.totalPages || 1;

    if (hasQuiz) {
      if (quizCompleted) return 100;

      const allBabsRead = readPages === totalPages;
      if (allBabsRead) return 90;

      // Progress bab maksimal 80% jika ada quiz
      return Math.round((readPages / totalPages) * 80);
    }

    return Math.round((readPages / totalPages) * 100);
  }

  isQuizCompleted(): boolean {
    return this.material?.quizCompleted || false;
  }

  canDownload(): boolean {
    return this.material?.flag_unduh || false;
  }

  goBack(): void {
    console.log('Manual back button clicked');
    this.hasUpdatedLastAccess = true;
    this.updateLastAccessed().finally(() => {
      this.router.navigate(['/siswa/materi']);
    });
  }

  // ✅ TAMBAH: Method updateLastAccessed yang hilang
  private updateLastAccessed(): Promise<any> {
    return new Promise((resolve) => {
      if (!this.materiId) {
        resolve(null);
        return;
      }

      this.studentProgressService.updateLastAccessed(this.materiId).subscribe({
        next: (response) => {
          console.log('✅ Last accessed updated successfully:', response);
          resolve(response);
        },
        error: (error) => {
          console.error('❌ Error updating last accessed:', error);
          resolve(null); // Resolve dengan null agar navigasi tetap jalan
        }
      });
    });
  }

  private updateLastAccessedSync(): void {
    if (!this.materiId) return;

    const token = localStorage.getItem('token');
    const baseUrl = this.studentProgressService.getApiUrl();
    const apiUrl = `${baseUrl}/materi/${this.materiId}/update-access`;

    console.log('🚀 Attempting sync update to:', apiUrl);

    if (typeof fetch !== 'undefined') {
      try {
        fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            materiId: this.materiId,
            timestamp: new Date().toISOString(),
            source: 'browser_navigation'
          }),
          keepalive: true
        }).then(response => {
          console.log('✅ Fetch keepalive success:', response.status);
        }).catch(error => {
          console.error('❌ Fetch keepalive failed:', error);
          this.fallbackToBeacon(apiUrl, token);
        });
        return;
      } catch (error) {
        console.error('❌ Fetch not available:', error);
      }
    }

    this.fallbackToBeacon(apiUrl, token);
  }

  private fallbackToBeacon(apiUrl: string, token: string | null): void {
    if (navigator.sendBeacon) {
      try {
        const data = JSON.stringify({
          materiId: this.materiId,
          timestamp: new Date().toISOString(),
          source: 'browser_navigation_beacon'
        });

        const success = navigator.sendBeacon(apiUrl, data);
        console.log('🔔 SendBeacon result:', success);

        if (success) return;
      } catch (error) {
        console.error('❌ SendBeacon failed:', error);
      }
    }

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', apiUrl, false);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({
        materiId: this.materiId,
        timestamp: new Date().toISOString(),
        source: 'browser_navigation_xhr'
      }));
      console.log('📡 Sync XHR result:', xhr.status);
    } catch (error) {
      console.error('❌ Sync XHR failed:', error);
    }
  }

  // ✅ TAMBAH: Method untuk testing (temporary)
  testUpdateAccess(): void {
    console.log('🧪 Testing update access...');
    this.updateLastAccessedSync();
  }

  getQuizButtonText(): string {
    const allBabsRead = this.material?.readPages === this.material?.totalPages;
    const hasQuiz = this.material?.hasQuiz;
    const quizCompleted = this.material?.quizCompleted;

    if (!allBabsRead) {
      return 'Selesaikan Materi Dulu';
    }

    if (!hasQuiz) {
      return 'Tidak Ada Kuis';
    }

    if (quizCompleted) {
      return 'Lihat Riwayat Kuis';
    }

    return 'Kuis Latihan';
  }

  getQuizButtonClass(): string {
    const allBabsRead = this.material?.readPages === this.material?.totalPages;
    const hasQuiz = this.material?.hasQuiz;
    const quizCompleted = this.material?.quizCompleted;

    let baseClass = 'btn btn-quiz';

    if (!allBabsRead || !hasQuiz) {
      baseClass += ' disabled';
    } else if (quizCompleted) {
      baseClass += ' btn-quiz-completed'; // Class khusus untuk quiz yang sudah selesai
    }

    return baseClass;
  }

}
