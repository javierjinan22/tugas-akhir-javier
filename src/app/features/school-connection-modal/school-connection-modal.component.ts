import { Component, OnInit } from '@angular/core';
import { faExclamation } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ClassConnectionModalComponent } from '../class-connection-modal/class-connection-modal.component';
import { SchoolService } from 'src/app/service/school.service';
import { ClassService } from 'src/app/service/class.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-school-connection-modal',
  templateUrl: './school-connection-modal.component.html',
  styleUrls: ['./school-connection-modal.component.css']
})
export class SchoolConnectionModalComponent implements OnInit {

  faExclamation = faExclamation;
  school: any = null;
  showToast = false;
  toastMessage = '';
  toastClass = '';
  toastIcon = '';
  private toastTimeout?: number;

  constructor(
    public activeModal: BsModalRef,
    private modalService: BsModalService,
    private schoolService: SchoolService,
    private classService: ClassService, 
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  onCreateNewSchool() {
    this.activeModal.hide();
  }

  onUseThisSchool() {
    const token = localStorage.getItem('token');

    if (this.school && this.school.npsn) {
      this.showInfoToast('Sedang mengklaim sekolah...');

      // ✅ Kirim payload lengkap sesuai response findSchool
      const claimPayload = {
        npsn: this.school.npsn,
        sekolah: this.school.sekolah,
        kode_prop: this.school.kode_prop?.trim() || this.school.kode_prop,
        propinsi: this.school.propinsi,
        kode_kab_kota: this.school.kode_kab_kota?.trim() || this.school.kode_kab_kota,
        kabupaten_kota: this.school.kabupaten_kota,
        kode_kec: this.school.kode_kec?.trim() || this.school.kode_kec,
        kecamatan: this.school.kecamatan,
        alamat_jalan: this.school.alamat_jalan,
        lintang: this.school.lintang,
        bujur: this.school.bujur,
        bentuk: this.school.bentuk,
        status: this.school.status
      };

      console.log('📤 Sending claim payload:', claimPayload);

      this.schoolService.claimSchool(claimPayload, token!).subscribe({
        next: (response: any) => {
          console.log('✅ School claimed successfully:', response);
          
          const claimedSchool = response.sekolah || response.school || response.data || response;
          const schoolId = claimedSchool._id || claimedSchool.id || response._id || response.id;
          
          if (schoolId) {
            localStorage.setItem('schoolId', schoolId);
            localStorage.setItem('schoolName', claimedSchool.nama || claimedSchool.sekolah || this.school.sekolah);
          }

          this.showSuccessToast(`Berhasil mengklaim sekolah ${this.school.sekolah}!`);

          setTimeout(() => {
            this.activeModal.hide();
            this.checkSchoolClasses(claimedSchool, token!);
          }, 2000);
        },
        error: (err) => {
          console.error('❌ Gagal mengklaim sekolah:', err);
          
          let errorMessage = 'Gagal mengklaim sekolah. Silakan coba lagi.';
          
          // Handle specific error messages
          if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.status === 409) {
            errorMessage = 'Sekolah sudah diklaim oleh guru lain.';
          } else if (err.status === 400) {
            errorMessage = 'Data sekolah tidak valid.';
          } else if (err.status === 401) {
            errorMessage = 'Sesi login telah berakhir. Silakan login ulang.';
          }
          
          this.showErrorToast(errorMessage);
        }
      });
    } else {
      this.showErrorToast('Data sekolah tidak lengkap. Silakan coba cari ulang.');
    }
  }

  private showSuccessToast(message: string): void {
    this.toastMessage = message;
    this.toastClass = 'toast-success';
    this.toastIcon = 'fas fa-check-circle';
    this.showToast = true;

    this.toastTimeout = window.setTimeout(() => {
      this.hideToast();
    }, 3000);
  }

  private showErrorToast(message: string): void {
    this.toastMessage = message;
    this.toastClass = 'toast-error';
    this.toastIcon = 'fas fa-exclamation-circle';
    this.showToast = true;

    this.toastTimeout = window.setTimeout(() => {
      this.hideToast();
    }, 4000);
  }

  private showInfoToast(message: string): void {
    this.toastMessage = message;
    this.toastClass = 'toast-info';
    this.toastIcon = 'fas fa-info-circle';
    this.showToast = true;

    this.toastTimeout = window.setTimeout(() => {
      this.hideToast();
    }, 3000);
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

  private checkSchoolClasses(school: any, token: string) {
    const schoolId = school._id || school.id;

    if (!schoolId) {
      console.error('❌ School ID not found, showing class creation modal anyway');
      setTimeout(() => {
        this.showClassCreationModal(school);
      }, 300);
      return;
    }

    this.classService.getClassesBySchool(schoolId, token).subscribe({
      next: (response: any) => {
        console.log('📚 Classes response:', response);
        
        // Handle different response structures
        let classes = [];
        if (response.success && response.data) {
          classes = response.data;
        } else if (Array.isArray(response)) {
          classes = response;
        } else if (response.classes) {
          classes = response.classes;
        }

        // Filter active classes
        const activeClasses = classes.filter((cls: any) => !cls.archived_at && cls.flag_aktif !== 0);

        if (activeClasses && activeClasses.length > 0) {
          console.log('✅ Active classes found, redirecting to dashboard');
          this.closeAllModalsAndRedirect();
        } else {
          console.log('📝 No active classes found, showing class creation modal');
          setTimeout(() => {
            this.showClassCreationModal(school);
          }, 300);
        }
      },
      error: (err) => {
        console.error('❌ Error checking classes:', err);
        setTimeout(() => {
          this.showClassCreationModal(school);
        }, 300);
      }
    });
  }

  private closeAllModalsAndRedirect() {
    this.modalService.hide();

    setTimeout(() => {
      const openModals = this.modalService.getModalsCount();
      for (let i = 0; i < openModals; i++) {
        this.modalService.hide();
      }

      this.router.navigate(['/guru/dashboard']);
    }, 100);
  }

  private showClassCreationModal(school: any) {
    const classModal = this.modalService.show(ClassConnectionModalComponent, {
      class: 'modal-dialog-centered modal-lg',
      initialState: {
        school: school,
        isMandatory: true,
        isFromLogin: true
      },
      backdrop: 'static',
      keyboard: false
    });

    classModal.onHide?.subscribe(() => {
      setTimeout(() => {
        this.schoolService.getMySchool().subscribe({
          next: (updatedSchool: any) => {
            let activeClasses = [];
            
            // Handle different response structures
            if (updatedSchool.kelas) {
              activeClasses = updatedSchool.kelas.filter((cls: any) => cls.flag_aktif === 1);
            } else if (updatedSchool.data?.kelas) {
              activeClasses = updatedSchool.data.kelas.filter((cls: any) => cls.flag_aktif === 1);
            }

            if (activeClasses.length > 0) {
              console.log('✅ Classes created successfully, redirecting');
              this.closeAllModalsAndRedirect();
            } else {
              console.log('⚠️ No classes created, showing modal again');
              this.showClassCreationModal(school);
            }
          },
          error: (err) => {
            console.error('❌ Error verifying classes after creation:', err);
            this.showClassCreationModal(school);
          }
        });
      }, 500);
    });
  }
}