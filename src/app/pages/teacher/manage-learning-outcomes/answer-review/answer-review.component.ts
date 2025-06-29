import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { ModalSaveReviewComponent } from '../modal-save-review/modal-save-review.component';
import { Location } from '@angular/common';

interface StudentAnswer {
  questionType: string;
  question: string;
  answer: string;
  isCorrect: boolean | null;
}

@Component({
  selector: 'app-answer-review',
  templateUrl: './answer-review.component.html',
  styleUrls: ['./answer-review.component.css']
})
export class AnswerReviewComponent implements OnInit {

  studentAnswers: StudentAnswer[] = [
    {
      questionType: 'Isian singkat',
      question: 'Apa itu \'jejak digital\'?',
      answer: 'Gambar sidik jari kita di layar sentuh.',
      isCorrect: null
    },
    {
      questionType: 'Isian singkat',
      question: 'Berita bohong di internet disebut',
      answer: 'hoaks',
      isCorrect: null
    },
    {
      questionType: 'Pilihan ganda',
      question: 'Manakah contoh kata sandi yang kuat?',
      answer: 'Jawaban A',
      isCorrect: true
    }
  ];

  constructor(
    private router: Router,
    private modalService: BsModalService,
    private location: Location
  ) { }

  ngOnInit(): void {
  }

  onCancel(): void {
    this.location.back();
  }

  onSave(): void {
    this.modalService.show(ModalSaveReviewComponent, {
      class: 'modal-dialog-centered modal-md'
    });
  }
}
