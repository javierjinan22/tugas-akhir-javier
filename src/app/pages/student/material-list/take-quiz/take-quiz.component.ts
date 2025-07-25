import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BsModalService } from 'ngx-bootstrap/modal';
import { ModalStartQuizComponent } from '../modal-start-quiz/modal-start-quiz.component';

interface QuizAttempt {
  id: number;
  date: Date;
  score: number;
  isPassed: boolean;
}

interface Material {
  id: number;
  slug: string;
  title: string;
  progress: number;
  isRead: boolean;
  quizCompleted: boolean;
}

@Component({
  selector: 'app-take-quiz',
  templateUrl: './take-quiz.component.html',
  styleUrls: ['./take-quiz.component.css']
})
export class TakeQuizComponent implements OnInit {
  material: Material;
  currentPageContent!: SafeHtml;
  
  // Quiz history data
  quizAttempts: QuizAttempt[] = [
    { id: 1, date: new Date('2024-06-03 17:00'), score: 90, isPassed: true },
    { id: 2, date: new Date('2024-06-03 17:00'), score: 60, isPassed: false },
    { id: 3, date: new Date('2024-06-03 17:00'), score: 50, isPassed: false },
    { id: 4, date: new Date('2024-06-03 17:00'), score: 55, isPassed: false }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    private modalService: BsModalService
  ) { 
    // Mock material data
    this.material = {
      id: 1,
      slug: 'etika-penggunaan-internet',
      title: 'Etika Penggunaan Internet',
      progress: 80,
      isRead: true,
      quizCompleted: false
    };
  }

  ngOnInit(): void {
    // Get material slug from route params
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      // In a real app, you would fetch the material using this slug
      console.log('Loading quiz for material with slug:', slug);
    });
    
    // Set quiz intro content
    this.currentPageContent = this.sanitizer.bypassSecurityTrustHtml(`
      <h5>Aturan</h5>
      <p>Ini adalah modul untuk menguji pengetahuan Anda tentang materi yang sudah Anda pelajari.</p>
      <!-- Additional content here if needed -->
    `);
  }

  startQuiz(): void {
  const initialState = {
    materialId: this.material.id // Pass the ID to the modal
  };
  this.modalService.show(ModalStartQuizComponent, { 
    class: 'modal-dialog-centered',
    initialState 
  });
}

  viewQuizDetail(attempt: QuizAttempt): void {
    console.log('Viewing quiz attempt details:', attempt);
    // Navigate to the quiz detail page
    this.router.navigate([`/siswa/materi/lihat-materi/${this.material.id}/kuis/hasil`]);
  }

  goToAllMaterials(): void {
    this.router.navigate(['/siswa/materi']);
  }
}
