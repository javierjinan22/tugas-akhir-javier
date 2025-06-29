import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

interface Materi {
  judul: string;
  kelas: string[]; // Menggunakan array
}

@Component({
  selector: 'app-manage-materials',
  templateUrl: './manage-materials.component.html',
  styleUrls: ['./manage-materials.component.css']
})
export class ManageMaterialsComponent implements OnInit {

  @ViewChild('searchInput') searchInputRef!: ElementRef;

  daftarMateri: Materi[] = [
    {
      judul: 'Bab 1 Etika Digital',
      kelas: ['6 A', '6 B']
    },
    {
      judul: 'Bab 2 Keamanan Internet',
      kelas: ['5 A']
    },
    {
      judul: 'Bab 1 Literasi Digital',
      kelas: ['4 A']
    }
  ];

  keyword: string = '';

  get filteredMateri() {
    if (!this.keyword) return this.daftarMateri;
    const key = this.keyword.toLowerCase();
    return this.daftarMateri.filter(materi =>
      materi.judul.toLowerCase().includes(key) ||
      materi.kelas.some(k => k.toLowerCase().includes(key))
    );
  }

  constructor(
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  lihatMateri(materi: Materi) {
    alert('Lihat: ' + materi.judul);
  }

  editMateri() {
    this.router.navigate(['/guru/kelola-materi/edit-materi']);
  }

  hapusMateri(materi: Materi) {
    if (confirm(`Yakin hapus materi: ${materi.judul}?`)) {
      this.daftarMateri = this.daftarMateri.filter(m => m !== materi);
    }
  }

  onTambah() {
    this.router.navigate(['/guru/kelola-materi/tambah-materi']);
  }

  onSearch() {
    // Fokus ke input saat icon search diklik
    this.searchInputRef.nativeElement.focus();
    // Jika butuh, tambahkan logic filter manual di sini
  }

}
