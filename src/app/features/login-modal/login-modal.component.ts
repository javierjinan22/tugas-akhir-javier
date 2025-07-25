import { Component, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/service/auth.service';
import { ClassService } from 'src/app/service/class.service';
import { SelectRoleModalComponent } from '../select-role-modal/select-role-modal.component';
import { Router } from '@angular/router';
import { SchoolService, School, SchoolClass } from 'src/app/service/school.service';
import { InputNpsnModalComponent } from '../input-npsn-modal/input-npsn-modal.component';
import { ClassConnectionModalComponent } from '../class-connection-modal/class-connection-modal.component';

@Component({
  selector: 'app-login-modal',
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.css']
})
export class LoginModalComponent implements OnInit {

  loginForm!: FormGroup;
  bsModalRef: any;
  errorMsg: string = '';

  constructor(
    public activeModal: BsModalRef,
    private modalService: BsModalService,
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private schoolService: SchoolService,
    private classService: ClassService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmitLogin() {
    if (this.loginForm.invalid) {
      return;
    }


    this.authService.login(this.loginForm.value).subscribe(
      res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('role', res.role);
        
        // Store additional user data if available
        if (res.user) {
          localStorage.setItem('userId', res.user._id || res.user.id);
        }

        this.activeModal.hide();

        if (res.role === 'guru') {
          this.handleTeacherLogin();
        } else if (res.role === 'siswa') {
          this.router.navigate(['/siswa/dashboard']);
        }
      },
      err => {
        console.error('❌ Login error:', err);
        this.errorMsg = err?.error?.message || 'Login gagal, cek username atau password.';
      }
    );
  }

  private handleTeacherLogin() {
    
    // Cek apakah guru sudah punya sekolah dan kelas
    this.schoolService.getMySchool().subscribe({
      next: (school: School) => {

        if (school && school._id) {
          // Store school ID for later use
          localStorage.setItem('schoolId', school._id);
          
          // Cek apakah sekolah sudah punya kelas aktif
          this.checkSchoolClasses(school);
        } else {
          this.showInputNpsnModal();
        }
      },
      error: (err) => {
        console.error('❌ Error getting school:', err);

        if (err.status === 404) {
          this.showInputNpsnModal();
        } else {
          this.errorMsg = 'Terjadi error saat mengambil data sekolah';
        }
      }
    });
  }

  private checkSchoolClasses(school: School) {
    // Cek kelas dari response getMySchool (tidak perlu API call terpisah)
    const classes: SchoolClass[] = school.kelas || [];
    
    // Filter hanya kelas yang aktif
    const activeClasses = classes.filter((cls: SchoolClass) => cls.flag_aktif === 1);

    if (activeClasses.length > 0) {
      // Sekolah punya kelas aktif - lanjut ke dashboard
      this.router.navigate(['/guru/dashboard']);
    } else {
      // Sekolah belum punya kelas aktif - show class creation modal
      this.showClassConnectionModal(school);
    }
  }

  private showInputNpsnModal() {
    this.bsModalRef = this.modalService.show(InputNpsnModalComponent, {
      class: 'modal-dialog-centered modal-md'
    });

    // Listen ketika NPSN modal ditutup
    this.bsModalRef.onHide?.subscribe(() => {
      
      setTimeout(() => {
        // Cek lagi apakah sekolah sudah di-claim
        this.schoolService.getMySchool().subscribe({
          next: (school: School) => {
            // Sekolah berhasil di-claim, cek kelas
            this.checkSchoolClasses(school);
          },
          error: (err) => {
            // Jika masih belum ada sekolah, redirect ke dashboard
            this.router.navigate(['/guru/dashboard']);
          }
        });
      }, 500);
    });
  }

  private showClassConnectionModal(school: School) {
    
    const initialState = {
      school: school, // Pass data sekolah ke modal
      isMandatory: true, // Indicate that class creation is mandatory
      isFromLogin: true // Indicate this modal is opened from login flow
    };

    this.bsModalRef = this.modalService.show(ClassConnectionModalComponent, {
      class: 'modal-dialog-centered modal-lg',
      initialState,
      backdrop: 'static', // Prevent closing by clicking backdrop
      keyboard: false // Prevent closing with ESC key
    });

    // Listen ketika class creation modal ditutup
    this.bsModalRef.onHide?.subscribe(() => {
      
      setTimeout(() => {
        // Verify that at least one class was created before redirecting
        this.schoolService.getMySchool().subscribe({
          next: (updatedSchool: School) => {
            const activeClasses = updatedSchool.kelas?.filter(cls => cls.flag_aktif === 1) || [];
            
            if (activeClasses.length > 0) {
              this.router.navigate(['/guru/dashboard']);
            } else {
              // If no classes were created, show the modal again
              this.showClassConnectionModal(school);
            }
          },
          error: (err) => {
            console.error('❌ Error verifying classes:', err);
            // In case of error, show modal again
            this.showClassConnectionModal(school);
          }
        });
      }, 500);
    });
  }

  onButtonRegistrationClicked(){
    this.activeModal.hide();
    this.bsModalRef = this.modalService.show(SelectRoleModalComponent, {
      class: 'modal-dialog-centered modal-md'
    });
  }
}