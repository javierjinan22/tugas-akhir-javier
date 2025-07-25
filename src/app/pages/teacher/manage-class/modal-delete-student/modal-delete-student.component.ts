import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { faExclamation, faUserMinus, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { ClassService, RemoveStudentResponse } from 'src/app/service/class.service';

@Component({
  selector: 'app-modal-delete-student',
  templateUrl: './modal-delete-student.component.html',
  styleUrls: ['./modal-delete-student.component.css']
})
export class ModalDeleteStudentComponent implements OnInit {

  // FontAwesome icons
  faExclamation = faExclamation; // Icon warning untuk header modal
  faUserMinus = faUserMinus;     // Icon untuk hapus siswa
  faSpinner = faSpinner;         // Icon loading

  // Data dari parent component
  studentData: any = null;
  classData: any = null;
  classId: string = '';
  
  // State management
  isDeleting: boolean = false;
  
  // Callback functions
  onDeleteSuccess?: () => void;
  onDeleteError?: (error: any) => void;

  constructor(
    public bsModalRef: BsModalRef,
    private classService: ClassService
  ) { }

  ngOnInit(): void {
  }

  deleteStudent(): void {
    if (this.isDeleting) {
      return;
    }
    
    this.isDeleting = true;
    const token = localStorage.getItem('token');

    if (!token) {
      console.error(' No token found');
      this.isDeleting = false;
      
      if (this.onDeleteError) {
        this.onDeleteError({ message: 'Token tidak ditemukan. Silakan login ulang.' });
      }
      this.bsModalRef.hide();
      return;
    }

    if (!this.classId || !this.studentData?._id) {
      console.error('Invalid data:', {
        classId: this.classId,
        studentId: this.studentData?._id
      });
      this.isDeleting = false;
      
      if (this.onDeleteError) {
        this.onDeleteError({ message: 'Data kelas atau siswa tidak valid.' });
      }
      this.bsModalRef.hide();
      return;
    }

    const studentId = this.studentData._id || this.studentData.id;

    // Call API to remove student from class
    this.classService.removeStudentFromClass(this.classId, studentId, token).subscribe({
      next: (response: RemoveStudentResponse) => {
        
        this.isDeleting = false;
        
        // Call success callback (tanpa alert)
        if (this.onDeleteSuccess) {
          this.onDeleteSuccess();
        }
        
        // Close modal
        this.bsModalRef.hide();
      },
      error: (error) => {
        
        this.isDeleting = false;
        
        // Prepare error message untuk callback
        let errorMessage = `Gagal menghapus siswa "${this.studentData?.nama_lengkap || this.studentData?.nama}" dari kelas. Silakan coba lagi.`;
        
        if (error.status === 403) {
          errorMessage = 'Anda tidak memiliki akses untuk menghapus siswa dari kelas ini.';
        } else if (error.status === 404) {
          errorMessage = 'Siswa atau kelas tidak ditemukan.';
        } else if (error.status === 409) {
          errorMessage = 'Siswa tidak terdaftar di kelas ini.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        // Call error callback (tanpa alert)
        if (this.onDeleteError) {
          this.onDeleteError({ 
            ...error, 
            message: errorMessage,
            studentName: this.studentData?.nama_lengkap || this.studentData?.nama,
            className: this.classData?.nama_kelas
          });
        }
        
        // Close modal setelah error
        this.bsModalRef.hide();
      }
    });
  }

  cancelAction(): void {
    if (this.isDeleting) {
      return;
    }

    this.bsModalRef.hide();
  }
}
