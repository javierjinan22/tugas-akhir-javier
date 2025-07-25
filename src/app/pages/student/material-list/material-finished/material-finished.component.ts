
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ModalDownloadComponent } from '../modal-download/modal-download.component';

interface Material {
  id: number;
  title: string;
  slug: string;
  completedDate: Date;
  izinkan_unduh: number;
}

@Component({
  selector: 'app-material-finished',
  templateUrl: './material-finished.component.html',
  styleUrls: ['./material-finished.component.css']
})
export class MaterialFinishedComponent implements OnInit {
  // Mock data for completed learning materials
  completedMaterials: Material[] = [
    {
      id: 1,
      title: 'Etika Penggunaan Internet',
      slug: 'etika-penggunaan-internet',
      completedDate: new Date('2023-12-10'),
      izinkan_unduh: 1
    },
    {
      id: 2,
      title: 'Belajar Literasi Digital Dasar',
      slug: 'belajar-literasi-digital-dasar',
      completedDate: new Date('2023-11-28'),
      izinkan_unduh: 0
    },
    {
      id: 3,
      title: 'Pembelajaran Berita Hoax',
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
    // You could load real data here from a service
  }

  viewMaterial(material: Material): void {
    console.log(`Viewing material: ${material.title}`);
    this.router.navigate(['/siswa/materi', material.slug]);
  }

  downloadMaterial(material: Material): void {
    console.log(`Opening download modal for: ${material.title}`);
    
    const initialState = {
      materialId: material.id,
      materialTitle: material.title,
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