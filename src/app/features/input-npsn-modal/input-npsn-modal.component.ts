import { Component, OnInit } from '@angular/core';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { faExclamation } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { SchoolConnectionModalComponent } from '../school-connection-modal/school-connection-modal.component';
import { SchoolService } from 'src/app/service/school.service';


@Component({
  selector: 'app-input-npsn-modal',
  templateUrl: './input-npsn-modal.component.html',
  styleUrls: ['./input-npsn-modal.component.css']
})
export class InputNpsnModalComponent implements OnInit {

  faExclamationCircle = faExclamationCircle;
  faExclamation = faExclamation;
  npsn: string = '';
  schoolNotFound: boolean = false;
  school: any;  // Data sekolah yang akan diklaim
  showToast = false;
  toastMessage = '';
  toastClass = '';
  toastIcon = '';
  private toastTimeout?: number;
  isSearching = false;

  constructor(
    public activeModal: BsModalRef,
    private modalService: BsModalService,
    private schoolService: SchoolService
  ) { }

  ngOnInit(): void {
  }

  onSearchSchool() {
    if (!this.npsn) {
      this.showErrorToast('Mohon masukkan NPSN sekolah');
      this.schoolNotFound = true;
      return;
    }

    if (this.npsn.length < 8) {
      this.showErrorToast('NPSN harus terdiri dari 8 digit angka');
      return;
    }

    console.log('🔍 Searching school with NPSN:', this.npsn);

    this.isSearching = true;
    this.showInfoToast('Mencari data sekolah...');

    this.schoolService.findSchool(this.npsn).subscribe(
      (response: any) => {
        console.log('✅ School found:', response);

        this.school = response;
        this.schoolNotFound = false;
        this.isSearching = false;

        // ✅ TAMBAH: Success toast
        this.showSuccessToast(`Sekolah ditemukan: ${response.sekolah}`);

        // ✅ Show konfirmasi modal setelah delay
        setTimeout(() => {
          const initialState = { school: this.school };
          const schoolConnectionModal = this.modalService.show(SchoolConnectionModalComponent, {
            class: 'modal-dialog-centered',
            initialState
          });

          schoolConnectionModal.onHide?.subscribe(() => {
            console.log('🏫 School connection modal closed');
          });
        }, 1500);
      },
      (error) => {
        console.error('❌ Error mencari sekolah:', error);
        this.isSearching = false;
        this.schoolNotFound = true;

        // ✅ TAMBAH: Specific error messages
        if (error.status === 404) {
          this.showErrorToast('Sekolah dengan NPSN tersebut tidak ditemukan');
        } else if (error.status === 400) {
          this.showErrorToast('Format NPSN tidak valid');
        } else {
          this.showErrorToast('Gagal mencari sekolah. Periksa koneksi internet Anda.');
        }
      }
    );
  }

  // ✅ TAMBAH: Same toast methods as above
  private showSuccessToast(message: string): void {
    this.hideToast(); // Clear any existing toast
    setTimeout(() => {
      this.toastMessage = message;
      this.toastClass = 'toast-success';
      this.toastIcon = 'fas fa-check-circle';
      this.showToast = true;

      this.toastTimeout = window.setTimeout(() => {
        this.hideToast();
      }, 3000);
    }, 100);
  }

  private showErrorToast(message: string): void {
    this.hideToast(); // Clear any existing toast
    setTimeout(() => {
      this.toastMessage = message;
      this.toastClass = 'toast-error';
      this.toastIcon = 'fas fa-exclamation-circle';
      this.showToast = true;

      this.toastTimeout = window.setTimeout(() => {
        this.hideToast();
      }, 4000);
    }, 100);
  }

  private showInfoToast(message: string): void {
    this.hideToast(); 
    setTimeout(() => {
      this.toastMessage = message;
      this.toastClass = 'toast-info';
      this.toastIcon = 'fas fa-info-circle';
      this.showToast = true;

      this.toastTimeout = window.setTimeout(() => {
        this.hideToast();
      }, 3000);
    }, 100);
  }

  hideToast(): void {
    this.showToast = false;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  ngOnDestroy(): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }
}
