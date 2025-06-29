import { Component, OnInit } from '@angular/core';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-create-student-account',
  templateUrl: './create-student-account.component.html',
  styleUrls: ['./create-student-account.component.css']
})
export class CreateStudentAccountComponent implements OnInit {

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

  constructor() { }

  ngOnInit(): void {
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  onCancelClicked(){

  }

  onSubmitClicked(){
    
  }

}
