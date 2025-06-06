import { Component, OnInit } from '@angular/core';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-student-registration-modal',
  templateUrl: './student-registration-modal.component.html',
  styleUrls: ['./student-registration-modal.component.css']
})
export class StudentRegistrationModalComponent implements OnInit {

  fullName = '';
  username = '';
  password = '';
  confirmPassword = '';
  selectedSchool: any;
  selectedClass: any;

  passwordVisible = false;
  confirmPasswordVisible = false;

  faEye = faEye;
  faEyeSlash = faEyeSlash;

  schools = [
    { id: 1, nama_sekolah: 'SD Negeri Kauman' },
    { id: 2, nama_sekolah: 'SD Negeri Muhammadiyah Bantul' },
    { id: 3, nama_sekolah: 'SD IT Salsabila' }
  ];

  classes = [
    { id: 1, nama_kelas: 'Kelas 1' },
    { id: 2, nama_kelas: 'Kelas 2' },
    { id: 3, nama_kelas: 'Kelas 3' }
  ];

  constructor(
    public activeModal: BsModalRef
  ) { }

  ngOnInit(): void {
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  onSubmitStudentRegistration() {

  console.log('selectedSchool:', this.selectedSchool);
  console.log('ID yg dikirim:', this.selectedSchool?.id);
  // console.log('Data Registrasi Siswa:', {
  //   fullName: this.fullName,
  //   username: this.username,
  //   password: this.password,
  //   confirmPassword: this.confirmPassword,
  //   selectedSchoolId: this.selectedSchool?.id,
  //   // selectedClassId: this.selectedClass?.id
  // });
  this.activeModal.hide();
}


}
