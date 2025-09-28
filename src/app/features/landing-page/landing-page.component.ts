import { Component, OnInit } from '@angular/core';
import { faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { faUsers, faDownload, faChartLine, faPen, faBookOpen, faComments } from '@fortawesome/free-solid-svg-icons';

import { LoginModalComponent } from '../login-modal/login-modal.component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { RankingService, SchoolRanking } from 'src/app/service/ranking.service';
import { ModalDetailTopSchoolComponent } from '../modal-detail-top-school/modal-detail-top-school.component';

interface TopSekolah {
    nama: string;
    progres: number;
    score?: number;
    lokasi?: string;
    total_siswa?: number;
  }

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {
  isSidebarOpen: boolean = false;
  bsModalRef: any;

  faAngleRight = faAngleRight;
  faStar = faStar;

  topSekolah: TopSekolah[] = [];
  schoolsData: SchoolRanking[] = [];
  isLoadingTopSchools: boolean = false;
  topSchoolsError: string = '';

  fiturList = [
  { judul: 'Kelola Kelas', deskripsi: 'Guru dapat membuat kelas, menambahkan siswa, serta mengelola materi dan kuis untuk masing-masing kelas dengan mudah.', icon: faUsers },
  { judul: 'Kuis & Latihan', deskripsi: 'Uji pemahaman dengan kuis pilihan ganda atau soal isian singkat setelah mempelajari materi. Belajar jadi makin seru!', icon: faPen },
  { judul: 'Materi Interaktif', deskripsi: 'Belajar literasi digital dengan materi berbentuk teks, gambar, dan video yang disajikan secara menarik dan mudah dipahami.', icon: faBookOpen },
  { judul: 'Unduh Materi', deskripsi: 'Siswa bisa mengunduh materi untuk belajar kapan saja, bahkan saat offline, agar pembelajaran lebih fleksibel.', icon: faDownload },
  { judul: 'Pantau Belajar', deskripsi: 'Pantau perkembangan belajar siswa melalui progres materi dan hasil kuis. Siswa bisa tahu sejauh mana mereka berkembang!', icon: faChartLine },
  { judul: 'Feedback & Penilaian', deskripsi: 'Guru memberikan nilai dan feedback langsung pada hasil kuis siswa untuk meningkatkan pemahaman secara personal.', icon: faComments }
];

  // topSekolah = [
  //   { nama: 'SD Muhammadiyah Bantul', progres: 90 },
  //   { nama: 'SD Negeri Kauman', progres: 85 },
  //   { nama: 'SD Muhammadiyah Ngaglik', progres: 70 },
  // ];

  panduanGuru = [
    {
      judul: 'Daftar atau Masuk Akun Guru',
      detail: [
        'Buat akun dengan memilih role ‘Guru’.',
        'Lengkapi data yang diperlukan seperti nama, email, dan informasi tambahan sesuai formulir.'
      ]
    },
    {
      judul: 'Kelola Kelas dengan Mudah',
      detail: ['Buat kelas baru dan atur kelas sesuai kebutuhan kamu.']
    },
    {
      judul: 'Buat Materi & Kuis',
      detail: [
        'Tambahkan materi berupa teks, video, atau gambar dengan cepat dan mudah.',
        'Buat kuis sesuai materi yang kamu ajarkan.'
      ]
    },
    {
      judul: 'Monitoring Perkembangan Siswa',
      detail: [
        'Pantau progres belajar siswa',
        'Berikan feedback secara personal untuk membantu perkembangan siswa.'
      ]
    }
  ];

  panduanSiswa = [
    {
      judul: 'Daftar atau Masuk Akun Siswa',
      detail: [
        'Pilih role “Siswa” saat kamu mendaftar.',
        'Isi data diri yang diminta dengan bantuan guru atau orang tua kamu.'
      ]
    },
    {
      judul: 'Mulai Belajar dengan Materi Menarik',
      detail: [
        'Pilih materi yang ingin kamu pelajari.',
        'Belajar dengan santai dan seru bersama Literadoo!'
      ]
    },
    {
      judul: 'Kerjakan Kuis Latihan',
      detail: [
        'Kerjakan kuis sebagai penguat materi.',
        'Lihat langsung nilai dan predikatmu setelah selesai mengerjakan kuis.'
      ]
    },
    {
      judul: 'Pantau Perkembangan Belajar Kamu',
      detail: [
        'Gunakan menu “Capaian Belajar” untuk melihat peringkat, feedback, dan medali yang kamu peroleh dari hasil belajar kamu selama ini.'
      ]
    }
  ];

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  constructor(
    private modalService: BsModalService,
    private rankingService: RankingService
  ) { }

  ngOnInit(): void {
    this.loadTopSchools();
  }

  loadTopSchools(): void {
    this.isLoadingTopSchools = true;
    this.topSchoolsError = '';

    this.rankingService.getSchoolRankings('', '', 3, 1).subscribe({
      next: (response) => {
        if (response.success && response.data.schools) {
          this.schoolsData = response.data.schools;
          
          this.topSekolah = response.data.schools.map((school: SchoolRanking, index: number) => ({
            nama: school.nama,
            progres: Math.round(school.statistik.avg_penyelesaian),
            score: school.statistik.score,
            lokasi: `${school.lokasi.kabupaten_kota}, ${school.lokasi.propinsi}`,
            total_siswa: school.statistik.total_siswa,
            schoolIndex: index 
          }));
        } else {
          this.topSchoolsError = 'Format data tidak valid';
          this.setFallbackTopSchools();
        }
        
        this.isLoadingTopSchools = false;
      },
      error: (error) => {
        console.error('❌ Error loading top schools:', error);
        this.isLoadingTopSchools = false;
        this.topSchoolsError = 'Gagal memuat data sekolah teraktif';
        this.setFallbackTopSchools();
      }
    });
  }

  private setFallbackTopSchools(): void {
    console.log('📝 Using fallback top schools data');
    this.topSekolah = [
      { nama: 'SD Muhammadiyah Bantul', progres: 90, lokasi: 'Bantul, DIY' },
      { nama: 'SD Negeri Kauman', progres: 85, lokasi: 'Yogyakarta, DIY' },
      { nama: 'SD Muhammadiyah Ngaglik', progres: 70, lokasi: 'Sleman, DIY' }
    ];
  }

  scrollTo(id: string) {
  const yOffset = -85; 
  const element = document.getElementById(id);
  if (element) {
    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}

  onButtonLoginClicked() {
    this.bsModalRef = this.modalService.show(LoginModalComponent, {
      class: 'modal-dialog-centered modal-md' // Bootstrap class: modal di tengah & ukuran medium
    });
  }

  openSchoolDetail(schoolIndex: number): void {
    const schoolData = this.schoolsData[schoolIndex];
    
    if (!schoolData) {
      console.error('❌ School data not found for index:', schoolIndex);
      return;
    }

    console.log('🏫 Opening school detail modal for:', schoolData.nama);

    const initialState = {
      schoolData: schoolData
    };

    this.bsModalRef = this.modalService.show(ModalDetailTopSchoolComponent, {
      initialState,
      class: 'modal-lg modal-dialog-centered',
      backdrop: 'static',
      keyboard: false
    });
  }

}
