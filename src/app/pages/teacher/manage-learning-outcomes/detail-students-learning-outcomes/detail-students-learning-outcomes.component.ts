import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { ModalAddFeedbackComponent } from '../modal-add-feedback/modal-add-feedback.component';

interface detailHasilBelajarSiswa {
  id: number;
  nama_siswa: string;
  status: number;
  nilai: number; 
}

@Component({
  selector: 'app-detail-students-learning-outcomes',
  templateUrl: './detail-students-learning-outcomes.component.html',
  styleUrls: ['./detail-students-learning-outcomes.component.css']
})
export class DetailStudentsLearningOutcomesComponent implements OnInit {

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

  siswa: detailHasilBelajarSiswa[] = [
    { id: 1, nama_siswa: 'Ahmad Farhan', status: 1, nilai: 85 },
    { id: 2, nama_siswa: 'Budi Santoso', status: 0, nilai: 90 },
    { id: 3, nama_siswa: 'Citra Dewi', status: 1, nilai: 78 },
    { id: 4, nama_siswa: 'Dian Purnama', status: 0, nilai: 88 },
    { id: 5, nama_siswa: 'Eko Prasetyo', status: 1, nilai: 92 },
    { id: 6, nama_siswa: 'Fira Kirana', status: 0, nilai: 80 },
    { id: 7, nama_siswa: 'Galih Pratama', status: 1, nilai: 75 },
    { id: 8, nama_siswa: 'Hana Putri', status: 0, nilai: 95 }
  ];

  selectedClass: any = null;
  selectedAcademicYear: any = null;
  keyword: string = '';
  filteredSiswa: detailHasilBelajarSiswa[] = [];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    this.selectedClass = this.classes[0];
    this.selectedAcademicYear = this.academicYears[0];

    // Initial filter
    this.filteredSiswa = [...this.siswa];
  }

  getStatusText(status: number): string {
  return status === 1 ? 'Selesai' : 'Belum dikoreksi';
  }
  

  onClassChange() {
    
  }

  onYearChange() {
    
  }

  onSearch() {
    if (!this.keyword.trim()) {
      this.filteredSiswa = [...this.siswa];
      return;
    }
    
    this.filteredSiswa = this.siswa.filter(siswa => 
      siswa.nama_siswa.toLowerCase().includes(this.keyword.toLowerCase())
    );
  }

  koreksiJawaban(siswa : detailHasilBelajarSiswa) {
    const materiId = this.activatedRoute.snapshot.paramMap.get('id');
    this.router.navigate([
      '/guru/hasil-belajar/detail-materi-belajar',
      materiId,
      'detail-siswa',
      siswa.id,
      'koreksi-jawaban'
    ]);

  }

  sendFeedback(siswa: detailHasilBelajarSiswa) {
    const initialState = { siswa };
    this.modalService.show(ModalAddFeedbackComponent, { class: 'modal-dialog-centered', initialState });
  }

}
