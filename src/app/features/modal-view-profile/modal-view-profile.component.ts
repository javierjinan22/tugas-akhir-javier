import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AuthService } from '../../service/auth.service';
import { faGraduationCap, faChalkboardTeacher, faUser, faEnvelope, faCalendar, faSchool, faUsers, faSpinner } from '@fortawesome/free-solid-svg-icons';

interface UserProfile {
  _id: string;
  nama_lengkap: string;
  username: string;
  email?: string;
  nuptk?: string;
  role: string;
  kelas?: {
    _id: string;
    nama_kelas: string;
    tahun_ajaran: string;
  };
  sekolah?: {
    _id: string;
    npsn: string;
    nama: string;
  };
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-modal-view-profile',
  templateUrl: './modal-view-profile.component.html',
  styleUrls: ['./modal-view-profile.component.css']
})
export class ModalViewProfileComponent implements OnInit {
  // ✅ Font Awesome Icons
  faGraduationCap = faGraduationCap;
  faChalkboardTeacher = faChalkboardTeacher;
  faUser = faUser;
  faEnvelope = faEnvelope;
  faCalendar = faCalendar;
  faSchool = faSchool;
  faUsers = faUsers;
  faSpinner = faSpinner;

  // ✅ Data Properties
  userProfile: UserProfile | null = null;
  loading = true;
  error = '';

  constructor(
    public bsModalRef: BsModalRef, // ✅ Inject BsModalRef langsung
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadProfile();
  }

  // ✅ Load user profile data
  loadProfile(): void {
    this.loading = true;
    this.error = '';

    this.authService.getProfile().subscribe({
      next: (response) => {
        console.log('Profile response:', response);
        if (response.success && response.data) {
          this.userProfile = response.data;
        } else if (response.user) {
          // Fallback jika struktur response berbeda
          this.userProfile = response.user;
        } else {
          this.error = 'Gagal memuat profil pengguna';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.error = 'Terjadi kesalahan saat memuat profil';
        this.loading = false;
      }
    });
  }

  // ✅ Get profile icon based on role
  getProfileIcon() {
    return this.userProfile?.role === 'siswa' ? this.faGraduationCap : this.faChalkboardTeacher;
  }

  // ✅ Get role display name
  getRoleDisplayName(): string {
    return this.userProfile?.role === 'siswa' ? 'Siswa' : 'Guru';
  }

  // ✅ Close modal - menggunakan bsModalRef langsung
  closeModal(): void {
    this.bsModalRef.hide();
  }

  // ✅ Retry loading profile
  retryLoad(): void {
    this.loadProfile();
  }
}
