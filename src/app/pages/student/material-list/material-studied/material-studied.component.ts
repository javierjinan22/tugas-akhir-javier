import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ModalDownloadComponent } from '../modal-download/modal-download.component';

interface Material {
  id: number;
  judul_materi: string;
  slug: string;
  completedDate: Date;
  izinkan_unduh: number;
}

@Component({
  selector: 'app-material-studied',
  templateUrl: './material-studied.component.html',
  styleUrls: ['./material-studied.component.css']
})
export class MaterialStudiedComponent implements OnInit {

  studiedMaterials: Material[] = [
    {
      id: 1,
      judul_materi: 'Etika Bersosial Media',
      slug: 'etika-penggunaan-internet',
      completedDate: new Date('2023-12-10'),
      izinkan_unduh: 1
    },
    {
      id: 2,
      judul_materi: 'Keamanan Password dan Data Pribadi',
      slug: 'belajar-literasi-digital-dasar',
      completedDate: new Date('2023-11-28'),
      izinkan_unduh: 0
    },
    {
      id: 3,
      judul_materi: 'Pembelajaran Pancasila dalam Kehidupan Digital',
      slug: 'pembelajaran-berita-hoax',
      completedDate: new Date('2023-11-15'),
      izinkan_unduh: 1
    }
  ];

  constructor(
    private router: Router,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
  }

  viewMaterial(material: Material): void {
    console.log(`Viewing material: ${material.judul_materi}`);
    this.router.navigate(['siswa/materi/lihat-materi']);
  }

  downloadMaterial(material: Material): void {
    console.log(`Opening download modal for: ${material.judul_materi}`);
    
    const initialState = {
      materialId: material.id,
      materialTitle: material.judul_materi,
      slug: material.slug
    };

    const modalRef: BsModalRef = this.modalService.show(ModalDownloadComponent, {
      class: 'modal-dialog-centered',
      initialState
    });

    // Optional: Handle modal result if needed
    modalRef.onHide?.subscribe(() => {
      console.log('Download modal closed');
    });
  }
}
