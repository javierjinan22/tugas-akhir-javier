import { Component, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { faExclamation } from '@fortawesome/free-solid-svg-icons';
import { UserService } from 'src/app/service/user.service';

@Component({
  selector: 'app-modal-add-student-to-class',
  templateUrl: './modal-add-student-to-class.component.html',
  styleUrls: ['./modal-add-student-to-class.component.css']
})
export class ModalAddStudentToClassComponent implements OnInit {

  faExclamationCircle = faExclamationCircle;
  faExclamation = faExclamation;
  
  // Data yang diterima dari parent component
  public student: any;
  public currentClassId: string = '';
  public oldClassId: string = '';
  public newClassId: string = '';
  public oldClassName: string = '';
  public newClassName: string = '';
  public newClassYear: string = '';
  public targetClassInfo: any = null; // Info lengkap kelas tujuan

  // Loading and error states
  public isSubmitting: boolean = false;
  public errorMsg: string = '';
  public successMsg: string = '';

  constructor(
    public activeModal: BsModalRef,
    private modalService: BsModalService,
    private userService: UserService
  ) { }

  ngOnInit(): void {

    // PERBAIKAN: Override newClassName dengan data dari targetClassInfo jika ada
    if (this.targetClassInfo && this.targetClassInfo.nama_kelas) {
      this.newClassName = this.targetClassInfo.nama_kelas;
      this.newClassYear = this.targetClassInfo.tahun_ajaran || '-';
    }
  }

  onCancelClicked(): void {
    this.activeModal.hide();
  }

  onSubmitClicked(): void {
    if (this.isSubmitting) {
      return;
    }

    // Validasi data
    if (!this.student || !this.student.id) {
      this.errorMsg = 'Data siswa tidak valid.';
      return;
    }

    if (!this.newClassId) {
      this.errorMsg = 'ID kelas tujuan tidak valid.';
      return;
    }

    // Jika siswa sudah di kelas yang sama
    if (this.oldClassId === this.newClassId) {
      this.errorMsg = 'Siswa sudah berada di kelas ini.';
      return;
    }

    this.isSubmitting = true;
    this.errorMsg = '';
    this.successMsg = '';

    const token = localStorage.getItem('token');
    if (!token) {
      this.errorMsg = 'Token tidak ditemukan. Silakan login ulang.';
      this.isSubmitting = false;
      return;
    }

    // Call API untuk update kelas siswa
    this.userService.updateStudentClass(this.student.id, this.newClassId, token).subscribe({
      next: (response) => {
        
        const targetClassName = this.targetClassInfo?.nama_kelas || 'kelas baru';
        this.successMsg = `Siswa ${this.student.fullName} berhasil dipindahkan ke ${targetClassName}.`;
        
        // Tutup modal setelah berhasil dengan delay
        setTimeout(() => {
          this.activeModal.hide();
        }, 2000);
      },
      error: (error) => {
        console.error('Error updating student class:', error);
        
        if (error.status === 400) {
          this.errorMsg = 'Data yang dikirim tidak valid.';
        } else if (error.status === 404) {
          this.errorMsg = 'Siswa atau kelas tidak ditemukan.';
        } else if (error.status === 403) {
          this.errorMsg = 'Anda tidak memiliki akses untuk memindahkan siswa ini.';
        } else {
          this.errorMsg = error?.error?.message || 'Gagal memindahkan siswa. Silakan coba lagi.';
        }
        
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }
}
