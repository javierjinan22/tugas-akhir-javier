import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
const ClassicEditor = require('@ckeditor/ckeditor5-build-classic');

@Component({
  selector: 'app-create-quiz',
  templateUrl: './create-quiz.component.html',
  styleUrls: ['./create-quiz.component.css']
})
export class CreateQuizComponent implements OnInit {

   quizForm!: FormGroup;

  // CKEditor
  public Editor = ClassicEditor;
  public editorConfig = {
    // plugin image, media, dll
    toolbar: [
      'heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote',
      '|', 'insertTable', 'imageUpload', 'mediaEmbed', 'undo', 'redo'
    ]
  };

  constructor(
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.quizForm = this.fb.group({
      questions: this.fb.array([
        this.createQuestionGroup()
      ])
    });
  }

  get questions(): FormArray {
    return this.quizForm.get('questions') as FormArray;
  }

  getJawabanArray(i: number): FormArray {
  return this.questions.at(i).get('jawaban') as FormArray;
}


  createQuestionGroup() {
    return this.fb.group({
      tipeSoal: ['pilihan_ganda', Validators.required],   // default: pilihan ganda
      soal: ['', Validators.required],
      jawaban: this.fb.array([ '', '', '', '' ], Validators.required), // 4 jawaban default
      kunci: [null, Validators.required], // index (misal 0)
      jawabanSingkat: ['']  // untuk isian singkat
    });
  }

  addQuestion(index: number) {
    this.questions.insert(index + 1, this.createQuestionGroup());
  }

  removeQuestion(index: number) {
    if (this.questions.length > 1) this.questions.removeAt(index);
  }

  onTipeSoalChange(i: number, tipe: string) {
    const qGroup = this.questions.at(i) as FormGroup;
    qGroup.patchValue({
      tipeSoal: tipe,
      kunci: null,
      jawaban: tipe === 'pilihan_ganda' ? ['', '', '', ''] : [],
      jawabanSingkat: ''
    });
    // Untuk FormArray jawaban jika switch dari isian_singkat ke pilihan_ganda
    if (tipe === 'pilihan_ganda' && !(qGroup.get('jawaban') as FormArray).length) {
      qGroup.setControl('jawaban', this.fb.array(['', '', '', '']));
    }
  }

  onSubmit() {
    if (this.quizForm.valid) {
      console.log(this.quizForm.value);
    } else {
      this.quizForm.markAllAsTouched();
    }
  }

  onCancel() {
    // Navigasi/batal
  }
}
