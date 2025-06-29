import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Student {
  id: number;
  nama: string;
  classId: number;
  academicYearId: number;
}

@Component({
  selector: 'app-class-detail',
  templateUrl: './class-detail.component.html',
  styleUrls: ['./class-detail.component.css']
})
export class ClassDetailComponent implements OnInit {

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

  students: Student[] = [
    { id: 1, nama: 'Ahmad Farhan', classId: 1, academicYearId: 1 },
    { id: 2, nama: 'Budi Santoso', classId: 1, academicYearId: 1 },
    { id: 3, nama: 'Citra Dewi', classId: 2, academicYearId: 1 },
    { id: 4, nama: 'Dian Purnama', classId: 2, academicYearId: 1 },
    { id: 5, nama: 'Eko Prasetyo', classId: 3, academicYearId: 1 },
    { id: 6, nama: 'Fira Kirana', classId: 1, academicYearId: 2 },
    { id: 7, nama: 'Galih Pratama', classId: 2, academicYearId: 2 },
    { id: 8, nama: 'Hana Putri', classId: 3, academicYearId: 2 }
  ];

  selectedClass: any = null;
  selectedAcademicYear: any = null;
  keyword: string = '';
  filteredSiswa: Student[] = [];

  constructor(
    private router: Router
  ) { }

  ngOnInit(): void {
    this.selectedClass = this.classes[0];
    this.selectedAcademicYear = this.academicYears[0];
    
    // Initial filter
    this.filterStudents();
  }

  filterStudents() {
    this.filteredSiswa = this.students.filter(student => {
      // Filter by class if selected
      const matchesClass = !this.selectedClass || student.classId === this.selectedClass.id;
      
      // Filter by academic year if selected
      const matchesYear = !this.selectedAcademicYear || student.academicYearId === this.selectedAcademicYear.id;
      
      // Filter by keyword if provided
      const matchesKeyword = !this.keyword || 
        student.nama.toLowerCase().includes(this.keyword.toLowerCase());
      
      return matchesClass && matchesYear && matchesKeyword;
    });
  }

  onSearch() {
    this.filterStudents();
  }

  onClassChange() {
    this.filterStudents();
  }

  onYearChange() {
    this.filterStudents();
  }

  onTambah() {
    // Logic to add new student
    console.log('Tambah student clicked');
    this.router.navigate(['/guru/kelola-kelas/detail-kelas', this.selectedClass.id, 'tambah-siswa']);
  }

  hapusSiswa(siswa: Student) {
    // Logic to delete student
    console.log('Hapus student:', siswa);
    this.filteredSiswa = this.filteredSiswa.filter(s => s.id !== siswa.id);
  }

}
