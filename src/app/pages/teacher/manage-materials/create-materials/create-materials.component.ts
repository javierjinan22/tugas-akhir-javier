import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { ClassService } from '../../../../service/class.service'; 
import { MaterialService } from '../../../../service/material.service'; 

const ClassicEditor = require('@ckeditor/ckeditor5-build-classic');

interface KelasOption {
  id: string;
  nama: string;
}

class Base64UploadAdapter {
  constructor(private loader: any) {}

  upload(): Promise<any> {
    return this.loader.file.then((file: File) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        resolve({
          default: reader.result
        });
      };
      
      reader.onerror = () => {
        reject(reader.error);
      };
      
      reader.readAsDataURL(file);
    }));
  }

  abort(): void {
    // Handle abort if needed
  }
}


@Component({
  selector: 'app-create-materials',
  templateUrl: './create-materials.component.html',
  styleUrls: ['./create-materials.component.css']
})
export class CreateMaterialsComponent implements OnInit {
  
  public Editor = ClassicEditor;

  public editorConfig = {
    placeholder: 'Tulis materi di sini...',
    toolbar: [
      'heading', '|', 'bold', 'italic', 'link', 
      'bulletedList', 'numberedList', 'blockQuote', 'insertTable',
      'imageUpload', 'mediaEmbed', 'sourceEditing', 'undo', 'redo'
    ],
    mediaEmbed: {
      previewsInData: true
    }
  };

  // ✅ NEW: Config khusus untuk soal kuis
  public soalEditorConfig = {
    placeholder: 'Tulis soal di sini...',
    toolbar: [
      'bold', 'italic', 'underline', '|',
      'bulletedList', 'numberedList', '|',
      'imageUpload', 'link', '|',
      'undo', 'redo'
    ],
    mediaEmbed: {
      previewsInData: true
    },
    // ✅ Khusus untuk soal, kita batasi beberapa fitur agar lebih fokus
    heading: {
      options: [
        { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
        { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' }
      ]
    }
  };

  // ✅ Method untuk setup upload adapter (existing - no change needed)
  onEditorReady(editor: any): void {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
      return new Base64UploadAdapter(loader);
    };
  }

  // ✅ STEP WIZARD PROPERTIES
  currentStep: number = 1;
  maxSteps: number = 2;

  // ✅ STATE MANAGEMENT
  isSubmitting: boolean = false;
  isLoadingClasses: boolean = false;
  errorMsg: string = '';

  kelasList: KelasOption[] = [];
  userProfile: any = null; 
  token: string = '';
  schoolId: string = '';

  // ✅ FORMS
  materialForm: FormGroup;
  quizForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private classService: ClassService,
    private materialService: MaterialService
  ) {
    // ✅ Form structure sesuai backend payload
    this.materialForm = this.fb.group({
      judul: ['', [Validators.required, Validators.minLength(2)]],
      deskripsi: ['', [Validators.required, Validators.minLength(2)]],
      kelas: [[], Validators.required],
      babList: this.fb.array([this.createBabGroup()]),
      izinkanUnduh: [false]
    });

    this.quizForm = this.fb.group({
      waktu_pengerjaan: [null, [Validators.required, Validators.min(1)]],
      questions: this.fb.array([
        this.createQuestionGroup()
      ])
    });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData() {
    this.token = localStorage.getItem('token') || '';
    this.schoolId = localStorage.getItem('schoolId') || '';
    const userProfileStr = localStorage.getItem('userProfile');
    
    if (userProfileStr) {
      try {
        this.userProfile = JSON.parse(userProfileStr);
      } catch (error) {
        console.error('Error parsing user profile:', error);
      }
    }

    if (!this.token) {
      this.errorMsg = 'Token tidak ditemukan. Silakan login ulang.';
      return;
    }

    if (!this.schoolId) {
      this.errorMsg = 'School ID tidak ditemukan. Silakan login ulang.';
      return;
    }

    this.loadActiveClasses();
  }

  loadActiveClasses() {

    this.isLoadingClasses = true;
    this.errorMsg = '';

    this.classService.getActiveClassesBySchool(this.schoolId, this.token)
      .subscribe({
        next: (response) => {
          this.handleClassesResponse(response);
        },
        error: (error) => {
          console.error('❌ getActiveClassesBySchool failed:', error);
          
          this.classService.getClassesBySchool(this.schoolId, this.token)
            .subscribe({
              next: (response) => {
                this.handleClassesResponse(response);
              },
              error: (fallbackError) => {
                console.error('❌ Fallback getClassesBySchool also failed:', fallbackError);
                
                this.classService.getClassesBySchoolWithStatus(this.schoolId, 1, this.token)
                  .subscribe({
                    next: (response) => {
                      this.handleClassesResponse(response);
                    },
                    error: (finalError) => {
                      console.error('❌ All methods failed:', finalError);
                      this.handleClassesError(finalError);
                    }
                  });
              }
            });
        }
      });
  }

  private handleClassesResponse(response: any) {
    
    this.isLoadingClasses = false;
    
    if (response && response.success && response.data) {
      this.kelasList = response.data
        .filter((kelas: any) => kelas.flag_aktif === 1)
        .map((kelas: any) => ({
          id: kelas._id,
          nama: kelas.nama_kelas
        }));
      
      if (this.kelasList.length === 0) {
        this.errorMsg = 'Tidak ada kelas aktif ditemukan.';
      } else {
        this.errorMsg = '';
      }
    } else {
      console.warn('Invalid response structure:', response);
      this.kelasList = [];
      this.errorMsg = 'Format response tidak valid.';
    }
  }

  private handleClassesError(error: any) {
    console.error('Classes loading error:', error);
    this.isLoadingClasses = false;
    this.kelasList = [];
    
    if (error.status === 401) {
      this.errorMsg = 'Session expired. Silakan login ulang.';
    } else if (error.status === 403) {
      this.errorMsg = 'Tidak memiliki akses untuk melihat data kelas.';
    } else if (error.status === 404) {
      this.errorMsg = 'Endpoint tidak ditemukan. Periksa URL API.';
    } else {
      this.errorMsg = `Gagal memuat data kelas: ${error.message || 'Unknown error'}`;
    }
  }

  refreshClasses() {
    this.errorMsg = '';
    this.loadActiveClasses();
  }

  // ✅ BAB METHODS
  get babArray(): FormArray {
    return this.materialForm.get('babList') as FormArray;
  }

  createBabGroup(): FormGroup {
    return this.fb.group({
      judulBab: [''],
      isiBab: ['']
    });
  }

  addBab(index: number) {
    this.babArray.insert(index + 1, this.createBabGroup());
  }

  removeBab(index: number) {
    if (this.babArray.length > 1) {
      this.babArray.removeAt(index);
    }
  }

  // ✅ QUIZ METHODS
  get questions(): FormArray {
    return this.quizForm.get('questions') as FormArray;
  }

  getJawabanArray(i: number): FormArray {
    return this.questions.at(i).get('jawaban') as FormArray;
  }

  createQuestionGroup() {
    return this.fb.group({
      tipeSoal: ['pilihan_ganda', Validators.required],
      soal: ['', Validators.required],
      jawaban: this.fb.array(['', '', '', ''], Validators.required),
      kunci: [null, Validators.required],
      jawabanSingkat: ['']
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
    
    if (tipe === 'pilihan_ganda' && !(qGroup.get('jawaban') as FormArray).length) {
      qGroup.setControl('jawaban', this.fb.array(['', '', '', '']));
    }
  }

  goToStep(step: number) {
    if (step === 1) {
      this.currentStep = 1;
    } else if (step === 2) {
      if (this.isStep1Valid()) {
        this.currentStep = 2;
      } else {
        this.materialForm.markAllAsTouched();
        this.errorMsg = 'Mohon lengkapi form dengan benar sebelum melanjutkan ke step 2';
        return;
      }
    }
    this.errorMsg = '';
  }

  // ✅ TEMPLATE HELPER METHODS - UPDATED dengan touch validation
  hasEmptyAnswerAtIndex(questionIndex: number, answerIndex: number): boolean {
    const question = this.questions.at(questionIndex);
    const jawabanControl = question.get('jawaban') as FormArray;
    const answerControl = jawabanControl.at(answerIndex);
    
    // Only show error if field is touched
    const isTouched = answerControl?.touched || false;
    const isEmpty = !question.value.jawaban[answerIndex] || question.value.jawaban[answerIndex].trim() === '';
    
    return isTouched && isEmpty;
  }

  hasEmptyAnswers(questionIndex: number): boolean {
    const question = this.questions.at(questionIndex);
    const jawabanControl = question.get('jawaban') as FormArray;
    
    // Check if any jawaban control is touched
    const anyJawabanTouched = jawabanControl.controls.some(control => control.touched);
    
    if (!anyJawabanTouched) {
      return false; // Don't show error if no jawaban field is touched
    }
    
    const jawaban = question.value.jawaban;
    return jawaban.some((jawab: string) => !jawab || jawab.trim() === '');
  }

  hasNoSelectedKey(questionIndex: number): boolean {
    const question = this.questions.at(questionIndex);
    const kunciControl = question.get('kunci');
    
    // Only show error if any form interaction happened
    const anyFieldTouched = question.get('soal')?.touched || 
                         kunciControl?.touched ||
                         (question.get('jawaban') as FormArray)?.controls.some(c => c.touched);
  
    if (!anyFieldTouched) {
      return false; // Don't show error if no interaction yet
    }
    
    return question.value.kunci === null;
  }

  // ✅ NEW: Check if question has validation errors and should show them
  shouldShowQuestionErrors(questionIndex: number): boolean {
    const question = this.questions.at(questionIndex);
    const soalTouched = question.get('soal')?.touched || false;
    const kunciTouched = question.get('kunci')?.touched || false;
    const jawabanArray = question.get('jawaban') as FormArray;
    const anyJawabanTouched = jawabanArray?.controls.some(control => control.touched) || false;
    
    return soalTouched || kunciTouched || anyJawabanTouched;
  }

  // ✅ NEW: Check if isian singkat should show error
  shouldShowIsianSingkatError(questionIndex: number): boolean {
    const question = this.questions.at(questionIndex);
    const jawabanSingkatControl = question.get('jawabanSingkat');
    
    if (!jawabanSingkatControl?.touched) {
      return false;
    }
    
    return !jawabanSingkatControl.value || jawabanSingkatControl.value.trim() === '';
  }

  // ✅ NEW: Check if question soal should show error
  shouldShowSoalError(questionIndex: number): boolean {
    const question = this.questions.at(questionIndex);
    const soalControl = question.get('soal');
    
    if (!soalControl?.touched) {
      return false;
    }
    
    // ✅ Handle CKEditor content - check for empty or just whitespace/HTML tags
    const soalValue = soalControl.value;
    if (!soalValue) {
      return true;
    }
    
    // ✅ Remove HTML tags and check if there's actual content
    const textContent = soalValue.replace(/<[^>]*>/g, '').trim();
    return textContent.length === 0;
  }

  getCompleteQuestionsCount(): number {
    let count = 0;
    for (let i = 0; i < this.questions.length; i++) {
      if (this.isQuestionValid(i)) {
        count++;
      }
    }
    return count;
  }

  getIncompleteQuestionsCount(): number {
    return this.questions.length - this.getCompleteQuestionsCount();
  }

  onKelasChange(event: Event, kelasId: string) {
    const input = event.target as HTMLInputElement;
    const checked = input.checked;
    const arr: string[] = this.materialForm.value.kelas || [];

    if (checked) {
      if (!arr.includes(kelasId)) arr.push(kelasId);
    } else {
      const idx = arr.indexOf(kelasId);
      if (idx > -1) arr.splice(idx, 1);
    }
    
    this.materialForm.get('kelas')?.setValue(arr);
    this.materialForm.get('kelas')?.markAsTouched();
    
  }

  getSelectedKelasNames(): string[] {
    const selectedIds = this.materialForm.value.kelas || [];
    return this.kelasList
      .filter(kelas => selectedIds.includes(kelas.id))
      .map(kelas => kelas.nama);
  }

  trackByKelasId(index: number, kelas: KelasOption): string {
    return kelas.id;
  }

  isDraftValid(): boolean {
    return this.isStep1Valid();
  }

  isStep1Valid(): boolean {
    const judul = this.materialForm.get('judul');
    const deskripsi = this.materialForm.get('deskripsi');
    const kelas = this.materialForm.get('kelas');
    
    return !!(judul?.valid && 
             deskripsi?.valid && 
             kelas?.valid && 
             kelas?.value?.length > 0);
  }

  isStep2Valid(): boolean {
    const waktuPengerjaan = this.quizForm.get('waktu_pengerjaan');
  if (!waktuPengerjaan?.value || waktuPengerjaan.invalid) {
    return false;
  }

    const questions = this.questions;
    
    if (questions.length === 0) {
      return false;
    }

    return questions.controls.every((questionControl, index) => {
      return this.isQuestionValid(index);
    });
  }

  isQuestionValid(questionIndex: number): boolean {
    const question = this.questions.at(questionIndex);
    const questionValue = question.value;
    
    // ✅ Check soal with HTML content validation
    if (!questionValue.soal) {
      return false;
    }
    
    // ✅ Remove HTML tags and check actual content
    const soalTextContent = questionValue.soal.replace(/<[^>]*>/g, '').trim();
    if (soalTextContent.length === 0) {
      return false;
    }

    if (questionValue.tipeSoal === 'pilihan_ganda') {
      const allAnswersFilled = questionValue.jawaban.every((jawab: string) => 
        jawab && jawab.trim() !== ''
      );
      
      const hasValidKey = questionValue.kunci !== null && 
                         questionValue.kunci >= 0 && 
                         questionValue.kunci < 4;
      
      return allAnswersFilled && hasValidKey;
    } else if (questionValue.tipeSoal === 'isian_singkat') {
      return questionValue.jawabanSingkat && questionValue.jawabanSingkat.trim() !== '';
    }
    
    return false;
  }

  // ✅ UPDATED: Error message method
  getQuestionErrorMessage(questionIndex: number): string {
    const question = this.questions.at(questionIndex);
    const questionValue = question.value;
    
    // ✅ Handle CKEditor content validation
    if (!questionValue.soal) {
      return 'Soal wajib diisi';
    }
    
    const soalTextContent = questionValue.soal.replace(/<[^>]*>/g, '').trim();
    if (soalTextContent.length === 0) {
      return 'Soal wajib diisi';
    }

    if (questionValue.tipeSoal === 'pilihan_ganda') {
      const emptyAnswers = questionValue.jawaban.filter((jawab: string) => 
        !jawab || jawab.trim() === ''
      );
      
      if (emptyAnswers.length > 0) {
        return 'Semua pilihan jawaban harus diisi';
      }
      
      if (questionValue.kunci === null || questionValue.kunci < 0 || questionValue.kunci >= 4) {
        return 'Kunci jawaban harus dipilih';
      }
    } else if (questionValue.tipeSoal === 'isian_singkat') {
      if (!questionValue.jawabanSingkat || questionValue.jawabanSingkat.trim() === '') {
        return 'Kunci jawaban harus diisi';
      }
    }
    
    return '';
  }

  // ✅ FORM SUBMISSION METHODS
  onSubmitMaterial() {
    if (this.isStep1Valid()) {
      this.currentStep = 2;
      this.errorMsg = '';
    } else {
      this.materialForm.markAllAsTouched();
      this.errorMsg = 'Mohon lengkapi data utama: judul, deskripsi, dan pilih minimal satu kelas';
    }
  }

  onSubmitQuiz() {
    const waktuPengerjaanControl = this.quizForm.get('waktu_pengerjaan');
    if (!waktuPengerjaanControl?.value || waktuPengerjaanControl.invalid) {
      waktuPengerjaanControl?.markAsTouched();
      this.errorMsg = 'Waktu pengerjaan wajib diisi';
      return;
    }

    if (this.isStep2Valid()) {
      this.onFinalSubmit();
    } else {
      this.quizForm.markAllAsTouched();
      
      const invalidQuestions: number[] = [];
      this.questions.controls.forEach((questionControl, index) => {
        if (!this.isQuestionValid(index)) {
          invalidQuestions.push(index + 1);
        }
      });
      
      this.errorMsg = `Mohon lengkapi soal nomor: ${invalidQuestions.join(', ')}. Semua field wajib diisi.`;
    }
  }

  onSkipQuiz() {
    if (this.isDraftValid()) {
      this.isSubmitting = true;
      this.errorMsg = '';
      
      const materialData = this.materialForm.value;
      
      const filteredBabList = materialData.babList.filter((bab: any) => {
        const hasJudul = bab.judulBab && bab.judulBab.trim() !== '';
        const hasIsi = bab.isiBab && bab.isiBab.trim() !== '';
        return hasJudul || hasIsi;
      });
      
      const finalData = {
        judul: materialData.judul,
        deskripsi: materialData.deskripsi,
        kelas: materialData.kelas,
        babList: filteredBabList,
        izinkanUnduh: materialData.izinkanUnduh,
        quiz: [],
        sekolah: this.schoolId
      };
      
      this.materialService.addMaterial(finalData, this.token).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.backToManageMaterials();
        },
        error: (error) => {
          console.error('Error creating material draft:', error);
          this.isSubmitting = false;
          this.errorMsg = 'Gagal menyimpan draft materi. Silakan coba lagi.';
        }
      });
      
    } else {
      this.materialForm.markAllAsTouched();
      this.errorMsg = 'Mohon lengkapi minimal: judul, deskripsi, dan pilih kelas untuk menyimpan draft';
    }
  }

  onFinalSubmit() {
    if (!this.isStep1Valid()) {
      this.errorMsg = 'Data utama belum lengkap';
      this.currentStep = 1;
      return;
    }

    if (!this.isStep2Valid()) {
      this.errorMsg = 'Kuis belum lengkap. Mohon lengkapi semua soal.';
      return;
    }

    this.isSubmitting = true;
    this.errorMsg = '';

    const materialData = this.materialForm.value;
    const quizData = this.quizForm.value;
    // const waktuPengerjaan = quizData.waktu_pengerjaan;

    const transformedQuiz = quizData.questions.map((question: any) => {
      if (question.tipeSoal === 'pilihan_ganda') {
        const jawabanObjects = question.jawaban.map((text: string, idx: number) => ({
          label: ['A', 'B', 'C', 'D'][idx],
          text: text || ''
        }));
        const kunciLabel = question.kunci !== null ? ['A', 'B', 'C', 'D'][question.kunci] : 'A';
        return {
          jenis_soal: 'pilihan_ganda',
          soal: question.soal,
          jawaban: jawabanObjects,
          kunci_jawaban: kunciLabel,
          // waktu_pengerjaan: waktuPengerjaan 
        };
      } else {
        return {
          jenis_soal: 'isian_singkat',
          soal: question.soal,
          kunci_jawaban: question.jawabanSingkat,
          // waktu_pengerjaan: waktuPengerjaan
        };
      }
    });
    
    const filteredBabList = materialData.babList.filter((bab: any) => {
      const hasJudul = bab.judulBab && bab.judulBab.trim() !== '';
      const hasIsi = bab.isiBab && bab.isiBab.trim() !== '';
      return hasJudul || hasIsi;
    });
    
    const finalData = {
      judul: materialData.judul,
      deskripsi: materialData.deskripsi,
      kelas: materialData.kelas,
      babList: filteredBabList,
      izinkanUnduh: materialData.izinkanUnduh,
      quiz: transformedQuiz,
      waktu_pengerjaan: quizData.waktu_pengerjaan,
      sekolah: this.schoolId
    };

    this.materialService.addMaterial(finalData, this.token).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.backToManageMaterials();
      },
      error: (error) => {
        console.error('Error creating material with quiz:', error);
        this.isSubmitting = false;
        this.errorMsg = 'Gagal membuat materi dengan kuis. Silakan coba lagi.';
      }
    });
  }

  onBatal() {
    if (this.currentStep > 1) {
      this.currentStep = 1;
      this.errorMsg = '';
    } else {
      this.backToManageMaterials();
    }
  }

  backToManageMaterials() {
    this.router.navigate(['/guru/kelola-materi']);
  }
}
