import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Kelas {
  id: number;
  nama: string;
  jumlah_siswa: number;
}

@Component({
  selector: 'app-manage-class',
  templateUrl: './manage-class.component.html',
  styleUrls: ['./manage-class.component.css']
})
export class ManageClassComponent implements OnInit {

  kelas: Kelas[] = [
    { id: 1, nama: 'Kelas 1', jumlah_siswa: 25 },
    { id: 2, nama: 'Kelas 2', jumlah_siswa: 28 },
    { id: 3, nama: 'Kelas 3', jumlah_siswa: 23 },
    { id: 4, nama: 'Kelas 4', jumlah_siswa: 27 },
    { id: 5, nama: 'Kelas 5', jumlah_siswa: 30 },
    { id: 6, nama: 'Kelas 6', jumlah_siswa: 26 }
  ];

  keyword: string = '';
  filteredKelas: Kelas[] = [];

  constructor(
    private router: Router
  ) { }

  ngOnInit(): void {
    this.filteredKelas = [...this.kelas];
  }

  onSearch() {
    if (!this.keyword.trim()) {
      this.filteredKelas = [...this.kelas];
      return;
    }
    
    this.filteredKelas = this.kelas.filter(kelas => 
      kelas.nama.toLowerCase().includes(this.keyword.toLowerCase())
    );
  }

  onTambah() {
    // Logic to add new class
    console.log('Tambah kelas clicked');
    this.router.navigate(['/guru/kelola-kelas/tambah-kelas']);
  }

  lihatKelas(kelas: Kelas) {
    // View class details
    console.log('Lihat kelas:', kelas);
    // Navigate to class detail page or open a modal with class details
    this.router.navigate(['/guru/kelola-kelas/detail-kelas', kelas.id]);
  }

  editKelas(kelas: Kelas) {
    // Logic to edit class
    console.log('Edit kelas:', kelas);
    // Navigate to edit form or open a modal with edit form
    // Example: this.router.navigate(['/teacher/classes/edit', kelas.id]);
  }
}
