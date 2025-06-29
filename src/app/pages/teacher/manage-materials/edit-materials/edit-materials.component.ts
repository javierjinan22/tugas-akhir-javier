import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

const ClassicEditor = require('@ckeditor/ckeditor5-build-classic');

@Component({
  selector: 'app-edit-materials',
  templateUrl: './edit-materials.component.html',
  styleUrls: ['./edit-materials.component.css']
})
export class EditMaterialsComponent implements OnInit {

  public Editor = ClassicEditor;
  public editorConfig = {
    placeholder: 'Tulis materi di sini...',
    toolbar: [
      'heading', '|', 'bold', 'italic', 'underline', 'link', 
      'bulletedList', 'numberedList', 'blockQuote', 'insertTable',
      'imageUpload', 'mediaEmbed', 'undo', 'redo'
    ]
  };

  kelasList = ['4 A', '4 B', '5 A', '5 B', '6 A', '6 B', '7 A'];

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.form = this.fb.group({
      judul: ['', Validators.required],
      deskripsi: ['', Validators.required],
      kelas: [[], Validators.required],
      isiBab: [''],
      izinkanUnduh: [false]
    });
   }

  ngOnInit(): void {
  }

  onKelasChange(event: Event, kelas: string) {
  const input = event.target as HTMLInputElement;
  const checked = input.checked;
  const arr: string[] = this.form.value.kelas || [];

  if (checked) {
    if (!arr.includes(kelas)) arr.push(kelas);
  } else {
    const idx = arr.indexOf(kelas);
    if (idx > -1) arr.splice(idx, 1);
  }
  this.form.get('kelas')?.setValue(arr);
  this.form.get('kelas')?.markAsTouched();
}


  onSubmit() {
    if (this.form.valid) {
      alert('Form submitted!\n' + JSON.stringify(this.form.value, null, 2));
      // Submit logic here...
    } else {
      this.form.markAllAsTouched();
    }
  }

  onSkipQuiz() {
    this.router.navigate(['guru/kelola-materi/tambah-materi/tambah-quiz']);
  }

  onBatal() {
    // Navigasi ke halaman sebelumnya (atau router.navigate jika ingin)
    window.history.back();
  }

}
