import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface hasilBelajar {
  id: number;
  nama: string;
  jumlah_siswa: number;
  jumlah_materi: number;
}

@Component({
  selector: 'app-manage-learning-outcomes',
  templateUrl: './manage-learning-outcomes.component.html',
  styleUrls: ['./manage-learning-outcomes.component.css']
})
export class ManageLearningOutcomesComponent implements OnInit {

  kelas: hasilBelajar[] = [
    { id: 1, nama: 'Kelas 6A', jumlah_siswa: 25, jumlah_materi: 5 },
    { id: 2, nama: 'Kelas 6B', jumlah_siswa: 28, jumlah_materi: 6 },
    { id: 3, nama: 'Kelas 5A', jumlah_siswa: 23, jumlah_materi: 4 },
    { id: 4, nama: 'Kelas 5B', jumlah_siswa: 27, jumlah_materi: 5 },
    { id: 5, nama: 'Kelas 4A', jumlah_siswa: 30, jumlah_materi: 7 },
    { id: 6, nama: 'Kelas 4B', jumlah_siswa: 26, jumlah_materi: 6 }
  ];

  keyword: string = '';
  filteredKelas: hasilBelajar[] = [];

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

  lihatKelas(kelas: hasilBelajar) {
    // Navigate to class detail page or open a modal with class details
    this.router.navigate(['/guru/hasil-belajar/detail-materi-belajar', kelas.id]);
  }
}
