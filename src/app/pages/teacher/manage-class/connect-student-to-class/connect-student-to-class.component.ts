import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { ModalAddStudentToClassComponent } from '../modal-add-student-to-class/modal-add-student-to-class.component';
import { UserService, StudentData } from 'src/app/service/user.service';
import { SchoolService } from 'src/app/service/school.service';
import { ClassService } from 'src/app/service/class.service';

interface Student {
  id: string;
  fullName: string;
  username: string;
  currentClass?: string;
  currentClassId?: string;
  tahunAjaran?: string;
}

@Component({
  selector: 'app-connect-student-to-class',
  templateUrl: './connect-student-to-class.component.html',
  styleUrls: ['./connect-student-to-class.component.css']
})
export class ConnectStudentToClassComponent implements OnInit {

  // Data from API
  allStudentsData: StudentData[] = [];
  allStudents: Student[] = [];
  
  // UI data
  keyword: string = '';
  filteredStudents: Student[] = [];
  showResults: boolean = false;
  selectedClass: any = null;
  
  // Loading and error states
  isLoading: boolean = false;
  isSearching: boolean = false;
  errorMsg: string = '';
  schoolId: string = '';
  currentClassId: string = '';

  // Property untuk menyimpan info kelas saat ini
  currentClassInfo: any = null;

  classes = [
    { id: 1, nama_kelas: 'Kelas 1' },
    { id: 2, nama_kelas: 'Kelas 2' },
    { id: 3, nama_kelas: 'Kelas 3' }
  ];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private modalService: BsModalService,
    private userService: UserService,
    private schoolService: SchoolService,
    private classService: ClassService
  ) { }

  ngOnInit(): void {
    this.selectedClass = this.classes[0];
    
    // Get current class ID from route
    this.activatedRoute.params.subscribe(params => {
      this.currentClassId = params['id'];
      
      // Load current class info jika diperlukan
      this.loadCurrentClassInfo();
    });

    this.getSchoolIdAndLoadStudents();
  }

  // ✅ TAMBAH METHOD BACK TO CLASS DETAIL
  backToClassDetail(): void {
    this.router.navigate(['/guru/kelola-kelas/detail-kelas', this.currentClassId]);
  }

  private loadCurrentClassInfo(): void {
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('No token found');
      this.currentClassInfo = {
        id: this.currentClassId,
        nama_kelas: 'Kelas Tujuan (No Token)',
        tahun_ajaran: '-'
      };
      return;
    }


    this.classService.getClassById(this.currentClassId, token).subscribe({
      next: (response: any) => {
        
        // Handle different response structures
        let classData = null;
        if (response && response.data) {
          classData = response.data;
        } else if (response && response._id) {
          classData = response;
        } else if (response) {
          classData = response;
        }

        this.currentClassInfo = {
          id: classData?._id || classData?.id || this.currentClassId,
          nama_kelas: classData?.nama_kelas || `Fallback - ${this.currentClassId}`,
          tahun_ajaran: classData?.tahun_ajaran || '-',
          sekolah: classData?.sekolah || null,
          rawData: classData
        };

      },
      error: (error) => {
        console.error('❌ Error loading class info:', error);
        this.currentClassInfo = {
          id: this.currentClassId,
          nama_kelas: 'Kelas Tujuan',
          tahun_ajaran: '-'
        };
      }
    });
  }

  private getSchoolIdAndLoadStudents(): void {
    // Get school ID from localStorage or service
    this.schoolId = localStorage.getItem('schoolId') || '';
    
    if (this.schoolId) {
      this.loadAllStudentsInSchool();
    } else {
      // If no schoolId in localStorage, get from school service
      this.getSchoolInfo();
    }
  }

  private getSchoolInfo(): void {
    this.isLoading = true;
    const token = localStorage.getItem('token');

    if (!token) {
      this.errorMsg = 'Token tidak ditemukan. Silakan login ulang.';
      this.isLoading = false;
      return;
    }

    this.schoolService.getMySchool().subscribe({
      next: (response: any) => {
        
        // Handle different response structures
        let school = null;
        if (response && response.data) {
          school = response.data;
        } else if (response && response._id) {
          school = response;
        } else {
          school = response;
        }

        this.schoolId = school?._id || school?.id || '';
        
        if (this.schoolId) {
          localStorage.setItem('schoolId', this.schoolId);
          this.loadAllStudentsInSchool();
        } else {
          this.errorMsg = 'ID sekolah tidak ditemukan.';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error getting school info:', error);
        this.errorMsg = 'Gagal mendapatkan informasi sekolah.';
        this.isLoading = false;
      }
    });
  }

  private loadAllStudentsInSchool(): void {
    this.isLoading = true;
    this.errorMsg = '';
    
    const token = localStorage.getItem('token');

    if (!token) {
      this.errorMsg = 'Token tidak ditemukan. Silakan login ulang.';
      this.isLoading = false;
      return;
    }


    this.userService.getStudentsBySchool(this.schoolId, token).subscribe({
      next: (studentsData: StudentData[]) => {

        this.allStudentsData = studentsData;
        
        // Transform data for display
        this.allStudents = studentsData.map(student => {
          const processedStudent = {
            id: student._id,
            fullName: student.nama_lengkap || 'Nama tidak tersedia',
            username: student.username || 'Username tidak tersedia',
            currentClass: (student.kelas && student.kelas.nama_kelas) ? student.kelas.nama_kelas : 'Belum ada kelas',
            currentClassId: (student.kelas && student.kelas._id) ? student.kelas._id : '',
            tahunAjaran: (student.kelas && student.kelas.tahun_ajaran) ? student.kelas.tahun_ajaran : ''
          };
          
          return processedStudent;
        });

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.errorMsg = 'Gagal memuat data siswa. Silakan coba lagi.';
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    
    this.isSearching = true;
    this.showResults = true;
    
    this.filteredStudents = [];

    if (!this.keyword.trim()) {
      this.isSearching = false;
      this.filteredStudents = [];
      this.showResults = false;
      return;
    }

    const searchTerm = this.keyword.toLowerCase().trim();
    
    this.filteredStudents = this.allStudents.filter(student => {
      const fullName = (student.fullName || '').toLowerCase();
      const username = (student.username || '').toLowerCase();
      
      const matchesName = fullName.includes(searchTerm);
      const matchesUsername = username.includes(searchTerm);
      
      return matchesName || matchesUsername;
    });

    this.isSearching = false;
  }

  addStudentToClass(student: Student): void {
    
    // Pastikan currentClassInfo sudah ter-load
    if (!this.currentClassInfo) {
      console.warn('Class info not loaded yet, waiting...');
      setTimeout(() => {
        this.addStudentToClass(student);
      }, 500);
      return;
    }
    
    const initialState = { 
      student: student,
      currentClassId: this.currentClassId,
      oldClassId: student.currentClassId || '',
      newClassId: this.currentClassId,
      oldClassName: student.currentClass || 'Belum ada kelas',
      newClassName: this.currentClassInfo.nama_kelas || 'Kelas Tujuan',
      newClassYear: this.currentClassInfo.tahun_ajaran || '-',
      targetClassInfo: this.currentClassInfo
    };
    
    const modalRef = this.modalService.show(ModalAddStudentToClassComponent, {
      class: 'modal-dialog-centered',
      initialState
    });

    // Handle modal result
    modalRef.onHide?.subscribe(() => {
      this.loadAllStudentsInSchool();
      
      if (this.keyword) {
        setTimeout(() => this.onSearch(), 100);
      }
    });
  }

  onTambah(): void {
    this.activatedRoute.params.subscribe(params => {
      const classId = params['id'];
      
      // Navigate to create student account page with the class ID
      this.router.navigate(['buat-akun-siswa'], { relativeTo: this.activatedRoute });
    });
  }

  // Method to refresh data
  refreshData(): void {
    this.loadAllStudentsInSchool();
    this.keyword = '';
    this.filteredStudents = [];
    this.showResults = false;
  }

  // Method to clear search
  clearSearch(): void {
    this.keyword = '';
    this.filteredStudents = [];
    this.showResults = false;
  }

  // Debug method - hapus setelah testing
  
}
