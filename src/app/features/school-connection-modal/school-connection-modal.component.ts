import { Component, OnInit } from '@angular/core';
import { faExclamation } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ClassConnectionModalComponent } from '../class-connection-modal/class-connection-modal.component';

@Component({
  selector: 'app-school-connection-modal',
  templateUrl: './school-connection-modal.component.html',
  styleUrls: ['./school-connection-modal.component.css']
})
export class SchoolConnectionModalComponent implements OnInit {

  faExclamation = faExclamation;
  school: any;

  constructor(
    public activeModal: BsModalRef,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    console.log('Data sekolah diterima:', this.school);
  }

  onCreateNewSchool() {
    // Logika jika user ingin membuat sekolah baru
    console.log('User pilih buat sekolah baru');
    this.activeModal.hide();
    // Tambahkan navigasi atau logic lainnya sesuai kebutuhan
  }

  onUseThisSchool() {
    // Logika jika user ingin menggunakan sekolah yang dipilih
    console.log('User pilih gunakan sekolah:', this.school);
    this.activeModal.hide();
    // Tambahkan navigasi atau logic lainnya sesuai kebutuhan
    this.modalService.show(ClassConnectionModalComponent, {
      class: 'modal-dialog-centered'});
  }
}
