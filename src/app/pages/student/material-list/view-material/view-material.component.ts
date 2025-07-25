import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface MaterialPage {
  content: string; // HTML content
  isRead: boolean;
}

interface Material {
  id: number;
  slug: string;
  title: string;
  pages: MaterialPage[];
  progress: number;
  isRead: boolean;
  quizCompleted: boolean;
}

@Component({
  selector: 'app-view-material',
  templateUrl: './view-material.component.html',
  styleUrls: ['./view-material.component.css']
})
export class ViewMaterialComponent implements OnInit {
  material: Material;
  currentPageIndex: number = 0;
  currentPageContent!: SafeHtml;
  
  // Mock data for the material
  mockMaterial: Material = {
    id: 1,
    slug: 'etika-penggunaan-internet',
    title: 'Etika Penggunaan Internet',
    pages: [
      {
        content: `
          <h5>Pengantar</h5>
          <p>Perkembangan Teknologi Informasi dan Komunikasi (TIK) telah membuka banyak peluang bagi siswa untuk terhubung, belajar, dan berinteraksi secara digital. Salah satu manfaat utama dari perkembangan ini adalah kemampuan untuk berkomunikasi dengan orang-orang dari berbagai penjuru dunia melalui Internet. Namun, seperti halnya komunikasi di dunia nyata, komunikasi di dunia digital juga harus dilakukan dengan etika yang baik agar dapat menciptakan hubungan yang harmonis, saling menghargai, dan bertanggung jawab.</p>
          <p>Etika berkomunikasi di internet dikenal dengan istilah netiquette (network etiquette), yaitu tata krama dalam berinteraksi secara digital. Pemahaman dan penerapan netiquette penting diajarkan kepada siswa sekolah dasar agar mereka terbiasa berperilaku baik dalam aktivitas digital sejak dini.</p>
          <img src="assets/img/replika-foto-materi" alt="Anak menggunakan komputer">
        `,
        isRead: false
      },
      {
        content: `
          <h5>Komunikasi Digital</h5>
          <p>Komunikasi digital adalah kegiatan mengirim dan menerima pesan melalui sarana digital seperti tulisan, suara, gambar, serta bertukar file. Etika komunikasi digital merupakan cara atau pedoman dalam berinteraksi secara sopan, menghargai orang lain, dan bertanggung jawab dalam dunia maya.</p>
          <p>Beberapa contoh etika penggunaan internet yang penting untuk dipahami siswa antara lain:</p>
          <ul>
            <li>Tidak menggunakan kata-kata kasar atau menyakiti perasaan orang lain</li>
            <li>Tidak menyebarkan berita bohong (hoax)</li>
            <li>Menghargai privasi orang lain</li>
            <li>Tidak menggunakan akun orang lain tanpa izin</li>
          </ul>
        `,
        isRead: false
      },
      {
        content: `
          <h5>Dampak Positif Internet</h5>
          <p>Internet menyediakan banyak manfaat, terutama dalam bidang pendidikan:</p>
          <ul>
            <li>Akses informasi yang luas untuk pembelajaran</li>
            <li>Kemudahan berkomunikasi dengan guru dan teman</li>
            <li>Sumber bahan belajar yang beragam</li>
            <li>Kesempatan berkreasi dan berbagi karya</li>
          </ul>
          <p>Dengan memanfaatkan internet secara bijak, siswa dapat meningkatkan pengetahuan dan keterampilan mereka dengan cara yang menyenangkan dan interaktif.</p>
          <p>Dengan memanfaatkan internet secara bijak, siswa dapat meningkatkan pengetahuan dan keterampilan mereka dengan cara yang menyenangkan dan interaktif.</p>
        `,
        isRead: false
      },
      {
        content: `
          <h5>Dampak Negatif Internet</h5>
          <p>Selain dampak positif, penggunaan internet juga memiliki beberapa risiko:</p>
          <ul>
            <li>Kecanduan gadget dan internet</li>
            <li>Terpapar konten yang tidak sesuai usia</li>
            <li>Risiko perundungan siber (cyberbullying)</li>
            <li>Interaksi dengan orang yang tidak dikenal</li>
          </ul>
          <p>Orang tua dan guru perlu mengawasi penggunaan internet oleh anak-anak dan memberikan bimbingan tentang cara menggunakan internet dengan aman.</p>
          <img src="assets/images/material/internet-safety.jpg" alt="Internet safety">
        `,
        isRead: false
      },
      {
        content: `
          <h5>Tips Aman Berinternet</h5>
          <p>Berikut adalah beberapa tips keamanan untuk siswa saat menggunakan internet:</p>
          <ul>
            <li>Selalu minta izin orang tua saat akan menggunakan internet</li>
            <li>Jangan memberikan informasi pribadi seperti alamat rumah, nomor telepon, atau password kepada orang yang tidak dikenal</li>
            <li>Berhati-hati saat mengklik tautan atau mengunduh file</li>
            <li>Laporkan kepada orang tua atau guru jika menemukan konten yang tidak nyaman atau mencurigakan</li>
            <li>Batasi waktu penggunaan internet dan seimbangkan dengan aktivitas lain</li>
          </ul>
          <p>Dengan memahami dan menerapkan etika internet, siswa dapat memanfaatkan teknologi digital dengan bijaksana dan bertanggung jawab.</p>
        `,
        isRead: false
      }
    ],
    progress: 80,
    isRead: true,
    quizCompleted: false
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer
  ) { 
    // Initialize with the mock data
    this.material = this.mockMaterial;
    // In a real app, you would get the specific material based on route params
  }

  ngOnInit(): void {
    // Get material slug from route params
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      // In a real app, you would fetch the material using this slug
      console.log('Loading material with slug:', slug);
      
      // For now, just use the mock data
      this.loadPage(0); // Load the first page
    });
  }

  loadPage(pageIndex: number): void {
    if (pageIndex >= 0 && pageIndex < this.material.pages.length) {
      this.currentPageIndex = pageIndex;
      this.currentPageContent = this.sanitizer.bypassSecurityTrustHtml(
        this.material.pages[pageIndex].content
      );
      
      // Mark this page as read
      this.material.pages[pageIndex].isRead = true;
      
      // Update overall progress
      this.updateProgress();
    }
  }

  nextPage(): void {
    if (this.currentPageIndex < this.material.pages.length - 1) {
      this.loadPage(this.currentPageIndex + 1);
    }
  }

  previousPage(): void {
    if (this.currentPageIndex > 0) {
      this.loadPage(this.currentPageIndex - 1);
    }
  }

  updateProgress(): void {
  // Calculate the percentage of pages read (90% of total progress)
  const readPages = this.material.pages.filter(page => page.isRead).length;
  const totalPages = this.material.pages.length;
  const readingProgress = Math.round((readPages / totalPages) * 90); // 90% max for reading
  
  // Add 10% if quiz is completed
  const quizProgress = this.material.quizCompleted ? 10 : 0;
  
  // Total progress
  this.material.progress = readingProgress + quizProgress;
  
  // Mark material as read if all pages are read (keeps existing functionality)
  this.material.isRead = readPages === totalPages;
}

  takeQuiz(): void {
  if (this.material.isRead) {
    // Match the route pattern defined in app-routing.module.ts
    this.router.navigate(['/siswa/materi/lihat-materi', this.material.id, 'kuis']);
  }
}
}
