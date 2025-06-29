import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { ModalAddStudentToClassComponent } from '../modal-add-student-to-class/modal-add-student-to-class.component';

interface Student {
  id: number;
  fullName: string;
  username: string;
}

@Component({
  selector: 'app-connect-student-to-class',
  templateUrl: './connect-student-to-class.component.html',
  styleUrls: ['./connect-student-to-class.component.css']
})
export class ConnectStudentToClassComponent implements OnInit {

  students: Student[] = [
    { id: 1, fullName: 'Ahmad Fauzi', username: 'ahmad_fauzi' },
    { id: 2, fullName: 'Budi Santoso', username: 'budi123' },
    { id: 3, fullName: 'Citra Dewi', username: 'citradw' },
    { id: 4, fullName: 'Dian Purnama', username: 'dian_p' },
    { id: 5, fullName: 'Eko Prasetyo', username: 'eko_pras' },
    { id: 6, fullName: 'Fina Ratna', username: 'finaratna' },
    { id: 7, fullName: 'Galih Permana', username: 'galih22' },
    { id: 8, fullName: 'Hana Putri', username: 'hanaptr' },
    { id: 9, fullName: 'Irfan Mahendra', username: 'irfan_m' },
    { id: 10, fullName: 'Jihan Kartika', username: 'jihan_k' },
  ];

  classes = [
    { id: 1, nama_kelas: 'Kelas 1' },
    { id: 2, nama_kelas: 'Kelas 2' },
    { id: 3, nama_kelas: 'Kelas 3' }
  ];

  keyword: string = '';
  filteredStudents: Student[] = [];
  showResults: boolean = false;
  selectedClass: any = null;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    this.selectedClass = this.classes[0]; 
  }

  onSearch(): void {
    // Set flag to show results section
    this.showResults = true;
    
    if (!this.keyword.trim()) {
      this.filteredStudents = [];
      return;
    }

    const searchTerm = this.keyword.toLowerCase().trim();
    
    // Filter students by name or username
    this.filteredStudents = this.students.filter(student => 
      student.fullName.toLowerCase().includes(searchTerm) || 
      student.username.toLowerCase().includes(searchTerm)
    );
  }

  addStudentToClass(student: Student): void {
    const initialState = { student, class: this.selectedClass };
    this.modalService.show(ModalAddStudentToClassComponent, {
      class: 'modal-dialog-centered',
      initialState
    });
  }

  onTambah(): void {
    this.activatedRoute.params.subscribe(params => {
    const classId = params['id'];
    
    // Navigate to create student account page with the class ID
    this.router.navigate(['buat-akun-siswa'], { relativeTo: this.activatedRoute });
  });
  }
}
