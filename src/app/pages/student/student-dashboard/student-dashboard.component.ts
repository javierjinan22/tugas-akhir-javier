import { Component, OnInit } from '@angular/core';

interface Material {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
}

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit {

  recommendedMaterials: Material[] = [
    {
      id: 1,
      title: 'Etika Penggunaan Internet',
      description: 'Deskripsi singkat',
      imageUrl: 'assets/images/placeholder.png',
      link: '/materi/etika-internet'
    },
    {
      id: 2,
      title: 'Literasi Digital Dasar',
      description: 'Deskripsi singkat',
      imageUrl: 'assets/images/placeholder.png',
      link: '/materi/literasi-digital'
    },
    {
      id: 3,
      title: 'Etika Penggunaan Internet',
      description: 'Deskripsi singkat',
      imageUrl: 'assets/images/placeholder.png',
      link: '/materi/etika-internet-2'
    },
    {
      id: 4,
      title: 'Keamanan Digital',
      description: 'Deskripsi singkat',
      imageUrl: 'assets/images/placeholder.png',
      link: '/materi/keamanan-digital'
    },
    {
      id: 5,
      title: 'Media Sosial',
      description: 'Deskripsi singkat',
      imageUrl: 'assets/images/placeholder.png',
      link: '/materi/media-sosial'
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  onMulaiBelajar() {

  }

  navigateToMaterial(link: string): void {
    // Add your navigation logic here
    console.log('Navigating to:', link);
  }

}
