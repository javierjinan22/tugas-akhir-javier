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

  constructor(
    public activeModal: BsModalRef,
    private modalService: BsModalService,
    private schoolService: SchoolService,
    private classService: ClassService, // Tambah injection
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  onCreateNewSchool() {
    // Logika jika user ingin membuat sekolah baru
    this.activeModal.hide();
    // Tambahkan navigasi atau logic lainnya sesuai kebutuhan
  }

  onUseThisSchool() {
    const token = localStorage.getItem('token');
    
    if (this.school && this.school.npsn) {
      // Jika data sekolah valid dan ada NPSN
      this.schoolService.claimSchool({
        npsn: this.school.npsn,
        nama: this.school.sekolah
      }, token!).subscribe({
        next: (response: any) => {
          const claimedSchool = response.sekolah || response.school || response;
          
          // Setelah berhasil claim sekolah, cek apakah sekolah punya kelas
          this.checkSchoolClasses(claimedSchool, token!);
        },
        error: (err) => {
          console.error('Gagal mengklaim sekolah:', err);
        }
      });
    }
  }

  private checkSchoolClasses(school: any, token: string) {
    const schoolId = school._id || school.id;
    
    this.classService.getClassesBySchool(schoolId, token).subscribe({
      next: (classes: any) => {

        this.activeModal.hide(); // Tutup modal ini dulu
        
        if (classes && Array.isArray(classes) && classes.length > 0) {
          // Sekolah sudah punya kelas - langsung ke dashboard
          setTimeout(() => {
            this.router.navigate(['/guru/dashboard']);
          }, 300);
        } else {
          // Sekolah belum punya kelas - show class creation modal
          setTimeout(() => {
            this.modalService.show(ClassConnectionModalComponent, {
              class: 'modal-dialog-centered modal-lg',
              initialState: { school: school }
            });
          }, 300);
        }
      },
      error: (err) => {
        
        this.activeModal.hide(); // Tutup modal ini dulu
        
        // Jika error atau tidak ada kelas, asumsikan perlu buat kelas
        setTimeout(() => {
          this.modalService.show(ClassConnectionModalComponent, {
            class: 'modal-dialog-centered modal-lg',
            initialState: { school: school }
          });
        }, 300);
      }
    });
  }
}