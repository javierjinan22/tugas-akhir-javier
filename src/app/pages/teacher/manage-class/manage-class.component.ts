import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ClassService, ClassesBySchoolResponse } from 'src/app/service/class.service';
import { ModalConfirmationDeleteComponent } from './modal-confirmation-delete/modal-confirmation-delete.component';

@Component({
  selector: 'app-manage-class',
  templateUrl: './manage-class.component.html',
  styleUrls: ['./manage-class.component.css']
})
export class ManageClassComponent implements OnInit {

  kelas: any[] = [];
  filteredKelas: any[] = [];
  keyword: string = '';
  schoolId: string = '';
  token: string = '';
  loading: boolean = false;
  errorMsg: string = '';
  togglingClass: { [key: string]: boolean } = {};
  deletingClass: { [key: string]: boolean } = {};
  bsModalRef?: BsModalRef;

  constructor(
    private router: Router,
    private classService: ClassService,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    this.token = localStorage.getItem('token') || '';
    this.schoolId = localStorage.getItem('schoolId') || '';

    if (this.schoolId && this.token) {
      this.getClasses();
    } else {
      this.errorMsg = 'Data sekolah atau token tidak ditemukan. Silakan login ulang.';
    }
  }

  getClasses() {
    this.loading = true;
    this.errorMsg = '';
    

    this.classService.getClassesBySchool(this.schoolId, this.token).subscribe({
      next: (response: ClassesBySchoolResponse) => {

        if (response.success && response.data && Array.isArray(response.data)) {
          // ✅ FILTER: Hanya tampilkan kelas yang TIDAK diarsipkan (archived_at = null)
          this.kelas = response.data.filter(cls => !cls.archived_at);
          this.filteredKelas = [...this.kelas];
          
        } else {
          this.kelas = [];
          this.filteredKelas = [];
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error fetching classes:', err);
        this.errorMsg = 'Gagal memuat data kelas. Silakan coba lagi.';
        this.kelas = [];
        this.filteredKelas = [];
        this.loading = false;
      }
    });
  }

  onSearch() {
    
    if (!this.keyword.trim()) {
      this.filteredKelas = [...this.kelas];
      return;
    }
    
    this.filteredKelas = this.kelas.filter(kelas => 
      kelas.nama_kelas && kelas.nama_kelas.toLowerCase().includes(this.keyword.toLowerCase())
    );

  }

  onTambah() {
    this.router.navigate(['/guru/kelola-kelas/tambah-kelas']);
  }

  onArchiveClicked() {
    this.router.navigate(['/guru/kelola-kelas/arsip']);
  }

  lihatKelas(kelas: any) {
      this.router.navigate(['/guru/kelola-kelas/detail-kelas', kelas._id]);
  }

  editKelas(kelas: any) {
    this.router.navigate(['/guru/kelola-kelas/edit-kelas', kelas._id]);
  }

  // Updated hapus kelas to use modal
  hapusKelas(kelas: any) {
    const initialState = {
      classData: kelas
    };
    
    this.bsModalRef = this.modalService.show(
      ModalConfirmationDeleteComponent, 
      {
        initialState,
        class: 'modal-dialog-centered', // Hilangkan modal-lg untuk ukuran yang lebih compact
        backdrop: 'static'
      }
    );
    
    if (this.bsModalRef.content) {
      this.bsModalRef.content.onClose.subscribe((result: { action: string, permanent?: boolean }) => {
        if (result.action === 'delete') {
          this.processDeleteClass(kelas, result.permanent || false);
        } else {
          console.log('Delete operation cancelled');
        }
      });
    }
  }
  
  private processDeleteClass(kelas: any, isPermanent: boolean) {
    
    this.deletingClass[kelas._id] = true;
    
    this.classService.deleteClass(kelas._id, isPermanent, this.token).subscribe({
      next: (response) => {
        
        // ✅ SELALU REMOVE dari array karena:
        // - Jika permanent delete: kelas dihapus dari database
        // - Jika archive: kelas punya archived_at, jadi tidak tampil di ManageClass
        this.kelas = this.kelas.filter(k => k._id !== kelas._id);
        this.filteredKelas = this.filteredKelas.filter(k => k._id !== kelas._id);
        
        if (isPermanent) {
          alert(`Kelas "${kelas.nama_kelas}" berhasil dihapus secara permanen.`);
        } else {
          alert(`Kelas "${kelas.nama_kelas}" berhasil diarsipkan.`);
        }
        
        this.deletingClass[kelas._id] = false;
      },
      error: (error) => {
        console.error('❌ Error processing class:', error);
        
        let errorMessage = `Gagal ${isPermanent ? 'menghapus' : 'mengarsipkan'} kelas "${kelas.nama_kelas}". Silakan coba lagi.`;
        
        if (error.status === 403) {
          errorMessage = 'Anda tidak memiliki akses untuk menghapus kelas ini.';
        } else if (error.status === 404) {
          errorMessage = 'Kelas tidak ditemukan.';
        }
        
        alert(errorMessage);
        this.deletingClass[kelas._id] = false;
      }
    });
  }

  isDeleting(classId: string): boolean {
    return this.deletingClass[classId] || false;
  }

  toggleClassStatus(kelas: any, event: Event) {
    event.stopPropagation();
    
    const currentStatus = kelas.flag_aktif;
    const newStatus = currentStatus === 1 ? 0 : 1;
    const statusText = newStatus === 1 ? 'mengaktifkan' : 'menonaktifkan';
    
    
    this.togglingClass[kelas._id] = true;
    
    this.classService.toggleClassStatus(kelas._id, newStatus, this.token).subscribe({
      next: (response) => {
        
        const classIndex = this.kelas.findIndex(k => k._id === kelas._id);
        if (classIndex !== -1) {
          this.kelas[classIndex].flag_aktif = newStatus;
        }
        
        const filteredIndex = this.filteredKelas.findIndex(k => k._id === kelas._id);
        if (filteredIndex !== -1) {
          this.filteredKelas[filteredIndex].flag_aktif = newStatus;
        }
        
        
        this.togglingClass[kelas._id] = false;
      },
      error: (error) => {
        console.error('❌ Error toggling class status:', error);
        
        let errorMessage = `Gagal ${statusText} kelas "${kelas.nama_kelas}". Silakan coba lagi.`;
        
        if (error.status === 403) {
          errorMessage = 'Anda tidak memiliki akses untuk mengubah status kelas ini.';
        } else if (error.status === 404) {
          errorMessage = 'Kelas tidak ditemukan.';
        }
        
        alert(errorMessage);
        this.togglingClass[kelas._id] = false;
      }
    });
  }

  isToggling(classId: string): boolean {
    return this.togglingClass[classId] || false;
  }

  // Helper methods untuk stats - hanya hitung kelas yang tidak diarsipkan
  getActiveClassesCount(): number {
    if (!this.filteredKelas || !Array.isArray(this.filteredKelas)) {
      return 0;
    }
    return this.filteredKelas.filter(kelas => kelas && kelas.flag_aktif === 1).length;
  }

  getInactiveClassesCount(): number {
    if (!this.filteredKelas || !Array.isArray(this.filteredKelas)) {
      return 0;
    }
    return this.filteredKelas.filter(kelas => kelas && kelas.flag_aktif !== 1).length;
  }

  getTotalClassesCount(): number {
    if (!this.kelas || !Array.isArray(this.kelas)) {
      return 0;
    }
    return this.kelas.length;
  }

  getFilteredClassesCount(): number {
    if (!this.filteredKelas || !Array.isArray(this.filteredKelas)) {
      return 0;
    }
    return this.filteredKelas.length;
  }

  refreshClasses(): void {
    this.getClasses();
  }
}
