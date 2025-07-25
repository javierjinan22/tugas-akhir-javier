import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { ClassService, Student, StudentsResponse } from 'src/app/service/class.service';
import { ModalDeleteStudentComponent } from '../modal-delete-student/modal-delete-student.component';

@Component({
  selector: 'app-class-detail',
  templateUrl: './class-detail.component.html',
  styleUrls: ['./class-detail.component.css']
})
export class ClassDetailComponent implements OnInit {

  classId: string = '';
  classInfo: any = null;
  students: Student[] = [];
  filteredSiswa: Student[] = [];
  keyword: string = '';
  isLoading: boolean = false;
  errorMsg: string = '';

  selectedClass: any = null;
  selectedAcademicYear: any = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private classService: ClassService,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    // Ambil classId dari route parameter
    this.route.params.subscribe(params => {
      this.classId = params['id'];
      
      if (this.classId) {
        this.loadStudentsInClass();
      }
    });
  }

  // ✅ TAMBAH METHOD BACK TO MANAGE CLASSES
  backToManageClasses(): void {
    this.router.navigate(['/guru/kelola-kelas']);
  }

  loadStudentsInClass() {
    this.isLoading = true;
    this.errorMsg = '';
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      this.errorMsg = 'Token tidak ditemukan. Silakan login ulang.';
      this.isLoading = false;
      return;
    }

    this.classService.getStudentsInClass(this.classId, token).subscribe({
      next: (response: any) => {
        
        // Handle different response structures
        if (response.success && response.data) {
          this.students = response.data.siswa || [];
          this.classInfo = response.data.kelas || null;
        } else if (response.siswa) {
          // If direct array response
          this.students = response.siswa;
          this.classInfo = response.kelas || null;
        } else if (Array.isArray(response)) {
          // If response is direct array
          this.students = response;
        } else {
          this.students = [];
          console.warn('Unexpected response format:', response);
        }
        
        // Map data untuk kompatibilitas dengan template
        this.filteredSiswa = this.students.map(student => ({
          id: student._id,
          nama: student.nama_lengkap || 'Nama tidak tersedia',
          classId: 1,
          academicYearId: 1,
          ...student
        }));
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.errorMsg = 'Terjadi kesalahan saat memuat data siswa';
        this.isLoading = false;
      }
    });
  }

  filterStudents() {
    if (!this.keyword.trim()) {
      this.filteredSiswa = this.students.map(student => ({
        id: student._id,
        nama: student.nama_lengkap || 'Nama tidak tersedia',
        classId: 1,
        academicYearId: 1,
        ...student
      }));
      return;
    }
    
    this.filteredSiswa = this.students
      .filter(student => {
        const nama = student.nama_lengkap || '';
        return nama.toLowerCase().includes(this.keyword.toLowerCase());
      })
      .map(student => ({
        id: student._id,
        nama: student.nama_lengkap || 'Nama tidak tersedia',
        classId: 1,
        academicYearId: 1,
        ...student
      }));
  }

  onSearch() {
    this.filterStudents();
  }

  onClassChange() {
    // Implement class change logic if needed
    console.log('Class changed:', this.selectedClass);
  }

  onYearChange() {
    // Implement year change logic if needed
    console.log('Year changed:', this.selectedAcademicYear);
  }

  onTambah() {
    this.router.navigate(['/guru/kelola-kelas/detail-kelas', this.classId, 'tambah-siswa']);
  }

  // ✅ UPDATE: Gunakan modal untuk hapus siswa
  hapusSiswa(siswa: any) {
    
    const initialState = {
      studentData: siswa,
      classData: this.classInfo,
      classId: this.classId,
      onDeleteSuccess: () => {
        this.handleDeleteSuccess(siswa);
      },
      onDeleteError: (error: any) => {
        console.error('❌ Delete error callback triggered:', error);
        this.handleDeleteError(siswa, error);
      }
    };
    
    const modalRef = this.modalService.show(ModalDeleteStudentComponent, {
      class: 'modal-dialog-centered',
      initialState,
      ignoreBackdropClick: true,
      keyboard: false
    });

    modalRef.onHide?.subscribe(() => {
      console.log('Delete student modal closed');
    });
  }

  private handleDeleteSuccess(siswa: any): void {
    
    // Remove dari local arrays
    this.students = this.students.filter(s => s._id !== siswa._id);
    this.filteredSiswa = this.filteredSiswa.filter(s => s._id !== siswa._id);
    
    // Refresh data untuk memastikan konsistensi
    setTimeout(() => {
      this.loadStudentsInClass();
    }, 1000);
  }

  private handleDeleteError(siswa: any, error: any): void {
    console.error('❌ Error deleting student:', error);
    
    // Bisa menambahkan toast notification atau error handling lainnya
    console.error(`❌ ${error.message || 'Gagal menghapus siswa'}`);
  }

  // Method untuk refresh data
  refreshData() {
    this.loadStudentsInClass();
  }
}
