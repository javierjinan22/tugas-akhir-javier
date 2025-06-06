import { Component, OnInit } from '@angular/core';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { faExclamation } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { SchoolConnectionModalComponent } from '../school-connection-modal/school-connection-modal.component';


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

  constructor(
    public activeModal: BsModalRef,
    private modalService: BsModalService// Import modal service untuk membuka modal lain
  ) { }

  ngOnInit(): void {
  }

   onSearchSchool() {
    // Contoh mock data sekolah
    const schools = [
      { npsn: '1234', nama_sekolah: 'SD Negeri Kauman', kecamatan: 'Kecamatan Pleret', kabupaten: 'Kabupaten Bantul', provinsi: 'DIY' },
      { npsn: '5678', nama_sekolah: 'SD Muhammadiyah Bantul', kecamatan: 'Kecamatan Bantul', kabupaten: 'Kabupaten Bantul', provinsi: 'DIY' },
    ];

    // Cari sekolah berdasarkan NPSN
    const foundSchool = schools.find(school => school.npsn === this.npsn.trim());

    if (foundSchool) {
      this.schoolNotFound = false;
      // Tutup modal ini
      this.activeModal.hide();

      // Buka modal koneksi sekolah dan kirim data sekolah yang ditemukan
      const initialState = { school: foundSchool };
      this.modalService.show(SchoolConnectionModalComponent, { class: 'modal-dialog-centered', initialState });
    } else {
      // Tampilkan pesan error
      this.schoolNotFound = true;
    }
  }

}
