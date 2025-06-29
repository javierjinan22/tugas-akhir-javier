import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface detailHasilBelajarKelas {
  id: number;
  judul_materi: string;
  jml_diselesaikan: number;
  total_siswa: number; 
}

@Component({
  selector: 'app-detail-learning-outcomes',
  templateUrl: './detail-learning-outcomes.component.html',
  styleUrls: ['./detail-learning-outcomes.component.css']
})
export class DetailLearningOutcomesComponent implements OnInit {

  classes = [
    { id: 1, nama_kelas: 'Kelas 1' },
    { id: 2, nama_kelas: 'Kelas 2' },
    { id: 3, nama_kelas: 'Kelas 3' }
  ];

  academicYears = [
    { id: 1, nama: '2024/2025' },
    { id: 2, nama: '2023/2024' },
    { id: 3, nama: '2022/2023' }
  ];

  materi: detailHasilBelajarKelas[] = [
    { id: 1, judul_materi: 'Etika penggunaan sosial media', jml_diselesaikan: 20 , total_siswa: 30 },
    { id: 2, judul_materi: 'Budaya digital', jml_diselesaikan: 18 , total_siswa: 30 },
    { id: 3, judul_materi: 'Keamanan digital', jml_diselesaikan: 22, total_siswa: 30 },
  ];

  selectedClass: any = null;
  selectedAcademicYear: any = null;
  keyword: string = '';
  filteredMateri: detailHasilBelajarKelas[] = [];

  constructor(
    private router: Router
  ) { }

  ngOnInit(): void {
    this.selectedClass = this.classes[0];
    this.selectedAcademicYear = this.academicYears[0];
    
    // Initial filter
    this.filteredMateri = [...this.materi];
  }

  onClassChange() {
    
  }

  onYearChange() {
    
  }

  onSearch() {
    if (!this.keyword.trim()) {
      this.filteredMateri = [...this.materi];
      return;
    }
    
    this.filteredMateri = this.materi.filter(materi => 
      materi.judul_materi.toLowerCase().includes(this.keyword.toLowerCase())
    );
  }

  lihatDetail(materi: detailHasilBelajarKelas) {
    this.router.navigate(['/guru/hasil-belajar/detail-materi-belajar', materi.id,'detail-siswa']);
  }


}
