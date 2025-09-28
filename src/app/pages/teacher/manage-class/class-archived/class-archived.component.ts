import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { ClassService, ClassesBySchoolResponse } from 'src/app/service/class.service';
import { ModalRestoreClassComponent } from '../modal-restore-class/modal-restore-class.component';

@Component({
  selector: 'app-class-archived',
  templateUrl: './class-archived.component.html',
  styleUrls: ['./class-archived.component.css']
})
export class ClassArchivedComponent implements OnInit {

  archivedClasses: any[] = [];
  filteredArchivedClasses: any[] = [];
  keyword: string = '';
  schoolId: string = '';
  token: string = '';
  loading: boolean = false;
  errorMsg: string = '';
  restoringClass: { [key: string]: boolean } = {};
  showToast = false;
  toastMessage = '';
  toastClass = '';
  toastIcon = '';
  private toastTimeout?: number;


  constructor(
    private router: Router,
    private classService: ClassService,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    this.token = localStorage.getItem('token') || '';
    this.schoolId = localStorage.getItem('schoolId') || '';

    if (this.schoolId && this.token) {
      this.getArchivedClasses();
    } else {
      this.errorMsg = 'Data sekolah atau token tidak ditemukan. Silakan login ulang.';
    }
  }

  restoreClass(kelas: any) {

    const initialState = {
      classData: kelas,
      onRestoreSuccess: () => {
        this.handleRestoreSuccess(kelas);
      },
      onRestoreError: (error: any) => {
        console.error('❌ Restore error callback triggered:', error);
        this.handleRestoreError(kelas, error);
      }
    };

    const modalRef = this.modalService.show(ModalRestoreClassComponent, {
      class: 'modal-dialog-centered',
      initialState,
      ignoreBackdropClick: true,
      keyboard: false
    });

    modalRef.onHide?.subscribe(() => {
      console.log('Modal closed');
    });
  }

  private handleRestoreSuccess(kelas: any): void {
    // Remove dari archived arrays karena sudah tidak diarsipkan lagi
    this.archivedClasses = this.archivedClasses.filter(k => k._id !== kelas._id);
    this.filteredArchivedClasses = this.filteredArchivedClasses.filter(k => k._id !== kelas._id);

    // ✅ Tampilkan toast sukses
    this.showSuccessToast(`Kelas "${kelas.nama_kelas}" berhasil dipulihkan!`);

    // Refresh data untuk memastikan konsistensi
    setTimeout(() => {
      this.getArchivedClasses();
    }, 1000);
  }

  private handleRestoreError(kelas: any, error: any): void {
    console.error('Error in restore callback:', error);
    let msg = `Gagal memulihkan kelas "${kelas.nama_kelas}". Silakan coba lagi.`;
    if (error?.error?.message) {
      msg = error.error.message;
    }
    this.showErrorToast(msg);
  }

  isRestoring(classId: string): boolean {
    return this.restoringClass[classId] || false;
  }

  backToManageClasses(): void {
    this.router.navigate(['/guru/kelola-kelas']);
  }

  getTotalArchivedClassesCount(): number {
    if (!this.archivedClasses || !Array.isArray(this.archivedClasses)) {
      return 0;
    }
    return this.archivedClasses.length;
  }

  getFilteredArchivedClassesCount(): number {
    if (!this.filteredArchivedClasses || !Array.isArray(this.filteredArchivedClasses)) {
      return 0;
    }
    return this.filteredArchivedClasses.length;
  }

  refreshArchivedClasses(): void {
    this.getArchivedClasses();
  }

  getArchivedDate(archivedAt: string): string {
    if (!archivedAt) return '';

    const date = new Date(archivedAt);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getArchivedClasses() {
    this.loading = true;
    this.errorMsg = '';

    this.classService.getClassesBySchool(this.schoolId, this.token).subscribe({
      next: (response: ClassesBySchoolResponse) => {

        if (response.success && response.data && Array.isArray(response.data)) {
          this.archivedClasses = response.data.filter(cls => cls.archived_at);
          this.filteredArchivedClasses = [...this.archivedClasses];

        } else {
          this.archivedClasses = [];
          this.filteredArchivedClasses = [];
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error fetching archived classes:', err);
        this.errorMsg = 'Gagal memuat data kelas yang diarsipkan. Silakan coba lagi.';
        this.archivedClasses = [];
        this.filteredArchivedClasses = [];
        this.loading = false;
      }
    });
  }

  onSearch() {

    if (!this.keyword.trim()) {
      this.filteredArchivedClasses = [...this.archivedClasses];
      return;
    }

    this.filteredArchivedClasses = this.archivedClasses.filter(kelas =>
      kelas.nama_kelas && kelas.nama_kelas.toLowerCase().includes(this.keyword.toLowerCase())
    );
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
