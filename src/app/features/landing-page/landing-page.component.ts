import { Component, OnInit } from '@angular/core';
import { faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { faUsers, faDownload, faChartLine, faPen, faBookOpen, faComments } from '@fortawesome/free-solid-svg-icons';

import { LoginModalComponent } from '../login-modal/login-modal.component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';


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

  fiturList = [
  { judul: 'Kelola Kelas', deskripsi: 'Guru dapat membuat kelas, menambahkan siswa, serta mengelola materi dan kuis untuk masing-masing kelas dengan mudah.', icon: faUsers },
  { judul: 'Kuis & Latihan', deskripsi: 'Uji pemahaman dengan kuis pilihan ganda atau soal isian singkat setelah mempelajari materi. Belajar jadi makin seru!', icon: faPen },
  { judul: 'Materi Interaktif', deskripsi: 'Belajar literasi digital dengan materi berbentuk teks, gambar, dan video yang disajikan secara menarik dan mudah dipahami.', icon: faBookOpen },
  { judul: 'Unduh Materi', deskripsi: 'Siswa bisa mengunduh materi untuk belajar kapan saja, bahkan saat offline, agar pembelajaran lebih fleksibel.', icon: faDownload },
  { judul: 'Pantau Belajar', deskripsi: 'Pantau perkembangan belajar siswa melalui progres materi dan hasil kuis. Siswa bisa tahu sejauh mana mereka berkembang!', icon: faChartLine },
  { judul: 'Feedback & Penilaian', deskripsi: 'Guru memberikan nilai dan feedback langsung pada hasil kuis siswa untuk meningkatkan pemahaman secara personal.', icon: faComments }
];

  topSekolah = [
    { nama: 'SD Muhammadiyah Bantul', progres: 90 },
    { nama: 'SD Negeri Kauman', progres: 85 },
    { nama: 'SD Muhammadiyah Ngaglik', progres: 70 },
  ];

  panduanGuru = [
    {
      judul: 'Daftar atau Masuk Akun Guru',
      detail: [
        'Buat akun gratis dengan memilih role ‘Guru’.',
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
        'Buat kuis interaktif (pilihan ganda atau isian singkat) sesuai materi yang kamu ajarkan.'
      ]
    },
    {
      judul: 'Monitoring Perkembangan Siswa',
      detail: [
        'Pantau progres belajar siswa',
        'Berikan feedback atau nilai secara personal untuk membantu perkembangan siswa.'
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
        'Seleksi kuis pilihan ganda atau isian singkat sebagai penguat materi.',
        'Lihat langsung nilai dan feedback dari guru setelah selesai mengerjakan kuis.'
      ]
    },
    {
      judul: 'Pantau Perkembangan Belajar Kamu',
      detail: [
        'Gunakan menu “Riwayat Belajar” untuk melihat nilai, feedback, dan hasil belajar kamu selama ini.'
      ]
    }
  ];

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  constructor(
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
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

}
