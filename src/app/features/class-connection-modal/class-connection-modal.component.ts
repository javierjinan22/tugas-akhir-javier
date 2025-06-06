import { Component, OnInit } from '@angular/core';

import { faExclamation } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-class-connection-modal',
  templateUrl: './class-connection-modal.component.html',
  styleUrls: ['./class-connection-modal.component.css']
})
export class ClassConnectionModalComponent implements OnInit {

  faExclamation = faExclamation;
  
  classData: { nama_kelas?: string; tahun_ajaran?: string }[] = [{}];  // Data yang menampung form input

  constructor(
    public activeModal: BsModalRef 
  ) { }

  ngOnInit(): void {
  }

  // Fungsi untuk menambah kelas baru
  onAdd() {
    this.classData.push({});  // Menambah kelas baru (form input baru)
  }

  // Fungsi untuk menghapus kelas berdasarkan index yang dipilih
  onRemove(event: any) {
    const index = event.index; // Ambil index yang diterima dari event
    if (this.classData.length > 1) {
      this.classData.splice(index, 1);  // Hapus kelas/form input berdasarkan index
    }
  }

  onCancelClicked() {
    this.activeModal.hide();
  }

  onSubmitClicked() {
    // Logic untuk meng-submit data kelas
    console.log(this.classData);  // Anda bisa mengganti ini dengan API atau form submit logic
  }
  
}
