import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { InputNpsnModalComponent } from 'src/app/features/input-npsn-modal/input-npsn-modal.component';
import { SchoolService } from 'src/app/service/school.service';

@Component({
  selector: 'app-teacher-dashboard',
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.css']
})
export class TeacherDashboardComponent implements OnInit {

  school: any = null;
  kelas: any[] = [];
  isLoggedIn: boolean = false;
  isTeacher: boolean = false;

  constructor(
    private router: Router,
    private schoolService: SchoolService,
    private modalService: BsModalService
  ) { 
    console.log('TeacherDashboardComponent constructed');
  }

  ngOnInit(): void {
    console.log('ngOnInit TeacherDashboardComponent');
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    this.isLoggedIn = !!token;
    this.isTeacher = role === 'guru';

    if (this.isLoggedIn && this.isTeacher) {
      console.log('Ready to fetch my school...');
      this.schoolService.getMySchool().subscribe({
        next: (data: any) => {
          this.school = data;
          this.kelas = data.kelas || [];
          
          if (this.school && this.school._id) {
          localStorage.setItem('schoolId', this.school._id);
        }
        },
        error: (err) => {
          this.school = null;
          this.kelas = [];

          // Tambahkan pengecekan error 404, buka modal input npsn!
          if (err.status === 404 && err.error?.message === 'Kamu belum mengelola sekolah manapun.') {
            console.log('User belum claim sekolah, buka modal claim sekolah.');
            this.modalService.show(InputNpsnModalComponent, {
              class: 'modal-dialog-centered modal-md'
            });
          } else {
            // Bisa handle error lain di sini jika perlu
            console.error('Error lain saat mengambil sekolah:', err);
          }
        }
      });
    }
  }

  onTambahMateri() {
    this.router.navigate(['guru/kelola-materi/tambah-materi']);
  }

}
