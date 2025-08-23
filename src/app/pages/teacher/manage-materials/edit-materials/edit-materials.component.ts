import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClassService } from '../../../../service/class.service';
import { MaterialService, Material } from '../../../../service/material.service';

const ClassicEditor = require('@ckeditor/ckeditor5-build-classic');

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

interface KelasOption {
  id: string;
  nama: string;
}

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
      'heading', '|', 'bold', 'italic', 'link',
      'bulletedList', 'numberedList', 'blockQuote', 'insertTable',
      'imageUpload', 'mediaEmbed', 'sourceEditing', 'undo', 'redo'
    ],
    mediaEmbed: {
      previewsInData: true
    }
  };

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
    heading: {
      options: [
        { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
        { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' }
      ]
    }
  };

  onEditorReady(editor: any): void {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
      return new Base64UploadAdapter(loader);
    };
  }

  currentStep: number = 1;
  maxSteps: number = 2;

  isSubmitting: boolean = false;
  isLoadingClasses: boolean = false;
  isLoadingMaterial: boolean = false;
  errorMsg: string = '';
  materialId: string = '';

  kelasList: KelasOption[] = [];
  originalMaterial: any | null = null;
  userProfile: any = null;
  token: string = '';
  schoolId: string = '';

  materialForm: FormGroup;
  quizForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private classService: ClassService,
    private materialService: MaterialService
  ) {
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
    this.materialId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.materialId) {
      this.errorMsg = 'ID materi tidak ditemukan';
      return;
    }

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
    this.loadMaterialData();
  }

  loadMaterialData() {
    this.isLoadingMaterial = true;
    this.errorMsg = '';

    this.materialService.getMaterialById(this.materialId, this.token).subscribe({
      next: (response) => {
        this.handleMaterialData(response);
      },
      error: (error) => {
        console.error('❌ Error loading material:', error);
        this.isLoadingMaterial = false;

        if (error.status === 404) {
          this.errorMsg = 'Materi tidak ditemukan';
        } else if (error.status === 403) {
          this.errorMsg = 'Anda tidak memiliki akses untuk mengedit materi ini';
        } else {
          this.errorMsg = 'Gagal memuat data materi. Silakan coba lagi.';
        }
      }
    });
  }

  handleMaterialData(response: any) {
    this.isLoadingMaterial = false;

    if (response.success && response.data) {
      this.originalMaterial = response.data;
      this.populateForms();
    } else {
      this.errorMsg = 'Format data materi tidak valid';
    }
  }

  populateForms() {
    if (!this.originalMaterial) return;

    this.materialForm.patchValue({
      judul: this.originalMaterial.judul_materi || '',
      deskripsi: this.originalMaterial.deskripsi_singkat || '',
      kelas: this.originalMaterial.kelas_ditautkan || [],
      izinkanUnduh: this.originalMaterial.flag_unduh || false
    });

    this.populateBabList();

    this.populateQuizForm();
  }

  populateBabList() {
    if (!this.originalMaterial) return;

    while (this.babArray.length > 0) {
      this.babArray.removeAt(0);
    }

    if (this.originalMaterial.babList && Array.isArray(this.originalMaterial.babList) && this.originalMaterial.babList.length > 0) {

      this.originalMaterial.babList.forEach((bab: any) => {
        const babGroup = this.createBabGroup();
        babGroup.patchValue({
          judulBab: bab.judulBab || '',
          isiBab: bab.isiBab || ''
        });
        this.babArray.push(babGroup);
      });
    } else {
      this.babArray.push(this.createBabGroup());
    }
  }

  populateQuizForm() {
    if (!this.originalMaterial || !this.originalMaterial.soal || this.originalMaterial.soal.length === 0) {
      return;
    }

    const waktuPengerjaan = this.originalMaterial.waktu_pengerjaan || null;
    this.quizForm.patchValue({
      waktu_pengerjaan: waktuPengerjaan
    });

    while (this.questions.length > 0) {
      this.questions.removeAt(0);
    }

    this.originalMaterial.soal.forEach((soal: any) => {
      const questionGroup = this.createQuestionGroup();

      if (soal.jenis_soal === 'pilihan_ganda') {
        const jawabanTexts = soal.jawaban ? this.extractJawabanTexts(soal.jawaban) : ['', '', '', ''];
        const kunciIndex = this.parseKunciJawabanFromLabel(soal.kunci_jawaban);

        questionGroup.patchValue({
          tipeSoal: 'pilihan_ganda',
          soal: soal.soal || '',
          jawaban: jawabanTexts,
          kunci: kunciIndex,
          jawabanSingkat: ''
        });

      } else if (soal.jenis_soal === 'isian_singkat') {
        questionGroup.patchValue({
          tipeSoal: 'isian_singkat',
          soal: soal.soal || '',
          jawaban: ['', '', '', ''],
          kunci: null,
          jawabanSingkat: soal.kunci_jawaban || ''
        });

      }

      this.questions.push(questionGroup);
    });
  }

  extractJawabanTexts(jawabanArray: any[]): string[] {
    if (!Array.isArray(jawabanArray) || jawabanArray.length === 0) {
      return ['', '', '', ''];
    }

    const sortedJawaban = jawabanArray.sort((a: any, b: any) => {
      const labelOrder = ['A', 'B', 'C', 'D'];
      return labelOrder.indexOf(a.label) - labelOrder.indexOf(b.label);
    });

    const texts = sortedJawaban.map((jawab: any) => jawab.text || '');

    while (texts.length < 4) {
      texts.push('');
    }

    return texts.slice(0, 4);
  }

  parseKunciJawabanFromLabel(kunciJawaban: string | undefined): number | null {
    if (!kunciJawaban) {
      return null;
    }

    if (typeof kunciJawaban === 'string') {
      const index = ['A', 'B', 'C', 'D'].indexOf(kunciJawaban.toUpperCase());
      return index >= 0 ? index : null;
    }

    if (typeof kunciJawaban === 'number') {
      return kunciJawaban >= 0 && kunciJawaban <= 3 ? kunciJawaban : null;
    }

    return null;
  }

  parseKunciJawaban(kunciJawaban: string): number | null {
    return this.parseKunciJawabanFromLabel(kunciJawaban);
  }

  loadActiveClasses() {
    this.isLoadingClasses = true;

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
                this.handleClassesError(fallbackError);
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
    } else {
      console.warn('Invalid response structure:', response);
      this.kelasList = [];
    }
  }

  private handleClassesError(error: any) {
    console.error('Classes loading error:', error);
    this.isLoadingClasses = false;
    this.kelasList = [];
  }

  refreshClasses() {
    this.loadActiveClasses();
  }

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

  hasEmptyAnswerAtIndex(questionIndex: number, answerIndex: number): boolean {
    const question = this.questions.at(questionIndex);
    const jawabanControl = question.get('jawaban') as FormArray;
    const answerControl = jawabanControl.at(answerIndex);

    const isTouched = answerControl?.touched || false;
    const isEmpty = !question.value.jawaban[answerIndex] || question.value.jawaban[answerIndex].trim() === '';

    return isTouched && isEmpty;
  }

  hasEmptyAnswers(questionIndex: number): boolean {
    const question = this.questions.at(questionIndex);
    const jawabanControl = question.get('jawaban') as FormArray;

    const anyJawabanTouched = jawabanControl.controls.some(control => control.touched);

    if (!anyJawabanTouched) {
      return false;
    }

    const jawaban = question.value.jawaban;
    return jawaban.some((jawab: string) => !jawab || jawab.trim() === '');
  }

  hasNoSelectedKey(questionIndex: number): boolean {
    const question = this.questions.at(questionIndex);
    const kunciControl = question.get('kunci');

    const anyFieldTouched = question.get('soal')?.touched ||
      kunciControl?.touched ||
      (question.get('jawaban') as FormArray)?.controls.some(c => c.touched);

    if (!anyFieldTouched) {
      return false;
    }

    return question.value.kunci === null;
  }

  shouldShowQuestionErrors(questionIndex: number): boolean {
    const question = this.questions.at(questionIndex);
    const soalTouched = question.get('soal')?.touched || false;
    const kunciTouched = question.get('kunci')?.touched || false;
    const jawabanArray = question.get('jawaban') as FormArray;
    const anyJawabanTouched = jawabanArray?.controls.some(control => control.touched) || false;

    return soalTouched || kunciTouched || anyJawabanTouched;
  }

  shouldShowIsianSingkatError(questionIndex: number): boolean {
    const question = this.questions.at(questionIndex);
    const jawabanSingkatControl = question.get('jawabanSingkat');

    if (!jawabanSingkatControl?.touched) {
      return false;
    }

    return !jawabanSingkatControl.value || jawabanSingkatControl.value.trim() === '';
  }

  shouldShowSoalError(questionIndex: number): boolean {
    const question = this.questions.at(questionIndex);
    const soalControl = question.get('soal');

    if (!soalControl?.touched) {
      return false;
    }

    const soalValue = soalControl.value;
    if (!soalValue) {
      return true;
    }

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

    if (!questionValue.soal) {
      return false;
    }

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
      this.errorMsg = 'Waktu pengerjaan wajib diisi.';
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

    const transformedQuiz = quizData.questions.map((question: any) => {
      if (question.tipeSoal === 'pilihan_ganda') {
        const jawabanObjects = question.jawaban.map((text: string, index: number) => ({
          label: ['A', 'B', 'C', 'D'][index],
          text: text || ''
        }));

        const kunciLabel = question.kunci !== null ? ['A', 'B', 'C', 'D'][question.kunci] : 'A';

        return {
          jenis_soal: 'pilihan_ganda',
          soal: question.soal || '',
          jawaban: jawabanObjects,
          kunci_jawaban: kunciLabel
        };
      } else {
        return {
          jenis_soal: 'isian_singkat',
          soal: question.soal || '',
          kunci_jawaban: question.jawabanSingkat || ''
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
      waktu_pengerjaan: quizData.waktu_pengerjaan,
      quiz: transformedQuiz,
      sekolah: this.schoolId
    };

    this.materialService.updateMaterial(this.materialId, finalData, this.token).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.backToManageMaterials();
      },
      error: (error) => {
        console.error('❌ Error updating material with quiz:', error);
        this.isSubmitting = false;
        this.errorMsg = 'Gagal memperbarui materi dengan kuis. Silakan coba lagi.';
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
