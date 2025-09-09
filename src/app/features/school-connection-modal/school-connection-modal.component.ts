import { Component, OnInit } from '@angular/core';
import { faExclamation } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ClassConnectionModalComponent } from '../class-connection-modal/class-connection-modal.component';
import { SchoolService } from 'src/app/service/school.service';
import { ClassService } from 'src/app/service/class.service'; // Tambah import
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

      this.schoolService.claimSchool({
        npsn: this.school.npsn,
        nama: this.school.sekolah
      }, token!).subscribe({
        next: (response: any) => {
          const claimedSchool = response.sekolah || response.school || response;
          localStorage.setItem('schoolId', claimedSchool._id || claimedSchool.id);

          this.showSuccessToast(`Berhasil mengklaim sekolah ${this.school.sekolah}!`);

          setTimeout(() => {
            this.activeModal.hide();
            this.checkSchoolClasses(claimedSchool, token!);
          }, 2000);
        },
        error: (err) => {
          console.error('Gagal mengklaim sekolah:', err);
          this.showErrorToast('Gagal mengklaim sekolah. Silakan coba lagi.');
        }
      });
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

    this.classService.getClassesBySchool(schoolId, token).subscribe({
      next: (classes: any) => {

        if (classes && Array.isArray(classes) && classes.length > 0) {
          this.closeAllModalsAndRedirect();
        } else {
          setTimeout(() => {
            this.showClassCreationModal(school);
          }, 300);
        }
      },
      error: (err) => {
        console.error(' Error checking classes:', err);
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
            const activeClasses = updatedSchool.kelas?.filter((cls: any) => cls.flag_aktif === 1) || [];

            if (activeClasses.length > 0) {
              this.closeAllModalsAndRedirect();
            } else {
              this.showClassCreationModal(school);
            }
          },
          error: (err) => {
            console.error('Error verifying classes after creation:', err);
            this.showClassCreationModal(school);
          }
        });
      }, 500);
    });
  }

}