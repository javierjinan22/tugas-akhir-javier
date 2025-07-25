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

  constructor(
    public activeModal: BsModalRef,
    private modalService: BsModalService,
    private schoolService: SchoolService 
  ) { }

  ngOnInit(): void {
  }

   onSearchSchool() {
    this.schoolService.findSchool(this.npsn).subscribe(
      (response: any) => {
        this.school = response;  // Menyimpan data sekolah sementara tanpa _id
        this.schoolNotFound = false;
        // Tampilkan modal konfirmasi untuk mengklaim sekolah
        const initialState = { school: this.school };  // Kirim data sekolah untuk modal selanjutnya
        this.modalService.show(SchoolConnectionModalComponent, {
          class: 'modal-dialog-centered',
          initialState
        });
        this.activeModal.hide();  // Menutup modal input NPSN
      },
      (error) => {
        this.schoolNotFound = true;
        console.error('Error mencari sekolah:', error);
      }
    );
  }


}
