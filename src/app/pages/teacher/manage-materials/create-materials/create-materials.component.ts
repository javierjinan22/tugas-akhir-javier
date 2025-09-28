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

interface KategoriOption {
  id: string;
  nama: string;
}

class Base64UploadAdapter {
  constructor(private loader: any) { }

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
    heading: {
      options: [
        { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
        { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' }
      ]
    }
  };

  // Method untuk setup upload adapter 
  onEditorReady(editor: any): void {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
      return new Base64UploadAdapter(loader);
    };
  }

  currentStep: number = 1;
  maxSteps: number = 2;

  isSubmitting: boolean = false;
  isLoadingClasses: boolean = false;
  errorMsg: string = '';

  kelasList: KelasOption[] = [];
  userProfile: any = null;
  token: string = '';
  schoolId: string = '';

  materialForm: FormGroup;
  quizForm: FormGroup;

  kategoriList: KategoriOption[] = [];
  isLoadingKategori: boolean = false;
  selectedHeaderImage: File | null = null;
  headerImagePreview: string | null = null;

  showToast = false;
  toastMessage = '';
  toastClass = '';
  toastIcon = '';
  private toastTimeout?: number;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private classService: ClassService,
    private materialService: MaterialService
  ) {
    this.materialForm = this.fb.group({
      judul: ['', [Validators.required, Validators.minLength(2)]],
      deskripsi: ['', [Validators.required, Validators.minLength(2)]],
      kategori: ['', Validators.required],
      kelas: [[], Validators.required],
      babList: this.fb.array([this.createBabGroup()]),
      izinkanUnduh: [false],
      flagAkses: [false]
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
    this.loadKategoriList();
  }

  loadKategoriList() {
    this.isLoadingKategori = true;

    this.materialService.getKategoriList(this.token).subscribe({
      next: (response) => {
        this.isLoadingKategori = false;

        if (response && response.success && response.data) {
          this.kategoriList = response.data.map((kategoriNama: string, index: number) => ({
            id: kategoriNama,
            nama: kategoriNama
          }));
        } else {
          this.kategoriList = [];
        }
      },
      error: (error) => {
        console.error('Error loading kategori:', error);
        this.isLoadingKategori = false;
        this.kategoriList = [];
      }
    });
  }

  onHeaderImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      const maxSize = 5 * 1024 * 1024;

      if (!allowedTypes.includes(file.type)) {
        this.errorMsg = 'Format file tidak didukung. Gunakan JPG, JPEG, atau PNG.';
        return;
      }

      if (file.size > maxSize) {
        this.errorMsg = 'Ukuran file terlalu besar. Maksimal 5MB.';
        return;
      }

      this.selectedHeaderImage = file;
      this.errorMsg = '';

      const reader = new FileReader();
      reader.onload = (e) => {
        this.headerImagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeHeaderImage(): void {
    this.selectedHeaderImage = null;
    this.headerImagePreview = null;

    const fileInput = document.getElementById('headerImageInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
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
          console.error('getActiveClassesBySchool failed:', error);

          this.classService.getClassesBySchool(this.schoolId, this.token)
            .subscribe({
              next: (response) => {
                this.handleClassesResponse(response);
              },
              error: (fallbackError) => {
                console.error('Fallback getClassesBySchool also failed:', fallbackError);

                this.classService.getClassesBySchoolWithStatus(this.schoolId, 1, this.token)
                  .subscribe({
                    next: (response) => {
                      this.handleClassesResponse(response);
                    },
                    error: (finalError) => {
                      console.error('All methods failed:', finalError);
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
      jawaban: this.fb.array(['', ''], Validators.required),
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

    if (tipe === 'pilihan_ganda') {
      qGroup.patchValue({
        tipeSoal: tipe,
        kunci: null,
        jawabanSingkat: ''
      });
      qGroup.setControl('jawaban', this.fb.array(['', '']));
    } else if (tipe === 'benar_salah') {
      qGroup.patchValue({
        tipeSoal: tipe,
        kunci: null,
        jawabanSingkat: ''
      });
      qGroup.setControl('jawaban', this.fb.array(['Benar', 'Salah']));
    } else if (tipe === 'isian_singkat') {
      qGroup.patchValue({
        tipeSoal: tipe,
        kunci: null,
        jawabanSingkat: ''
      });
      qGroup.setControl('jawaban', this.fb.array([]));
    }
  }

  getAnswerLabel(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D, E, F
  }

  getTrueFalseOption(index: number): string {
    return index === 0 ? 'Benar' : 'Salah';
  }

  addAnswer(questionIndex: number): void {
    const jawabanArray = this.getJawabanArray(questionIndex);
    const question = this.questions.at(questionIndex);

    if (jawabanArray.length < 6) { // Maksimal 6 jawaban
      jawabanArray.push(this.fb.control(''));
    }
  }

  removeAnswer(questionIndex: number, answerIndex: number): void {
    const jawabanArray = this.getJawabanArray(questionIndex);
    const question = this.questions.at(questionIndex);

    if (jawabanArray.length > 2) { // Minimal 2 jawaban
      jawabanArray.removeAt(answerIndex);

      // Reset kunci jawaban jika lebih besar dari jumlah jawaban
      const currentKunci = question.get('kunci')?.value;
      if (currentKunci !== null && currentKunci >= jawabanArray.length) {
        question.get('kunci')?.setValue(null);
      }
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
    const kategori = this.materialForm.get('kategori');
    const kelas = this.materialForm.get('kelas');

    return !!(judul?.valid &&
      deskripsi?.valid &&
      kategori?.valid &&
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

    if (questionValue.tipeSoal === 'pilihan_ganda' || questionValue.tipeSoal === 'benar_salah') {

      const nonEmptyAnswers = questionValue.jawaban.filter((jawab: string) =>
        jawab && jawab.trim() !== ''
      );

      const hasValidKey = questionValue.kunci !== null &&
        questionValue.kunci >= 0 &&
        questionValue.kunci < nonEmptyAnswers.length;

      return nonEmptyAnswers.length >= 2 && hasValidKey;
    } else if (questionValue.tipeSoal === 'isian_singkat') {
      return questionValue.jawabanSingkat && questionValue.jawabanSingkat.trim() !== '';
    }

    return false;
  }

  // Error message method
  getQuestionErrorMessage(questionIndex: number): string {
    const question = this.questions.at(questionIndex);
    const questionValue = question.value;

    if (!questionValue.soal) {
      return 'Soal wajib diisi';
    }

    const soalTextContent = questionValue.soal.replace(/<[^>]*>/g, '').trim();
    if (soalTextContent.length === 0) {
      return 'Soal wajib diisi';
    }

    if (questionValue.tipeSoal === 'pilihan_ganda') {
      const nonEmptyAnswers = questionValue.jawaban.filter((jawab: string) =>
        jawab && jawab.trim() !== ''
      );

      if (nonEmptyAnswers.length < 2) {
        return 'Minimal 2 pilihan jawaban harus diisi';
      }

      if (questionValue.kunci === null || questionValue.kunci < 0 || questionValue.kunci >= nonEmptyAnswers.length) {
        return 'Kunci jawaban harus dipilih';
      }
    } else if (questionValue.tipeSoal === 'benar_salah') {
      if (questionValue.kunci === null || (questionValue.kunci !== 0 && questionValue.kunci !== 1)) {
        return 'Pilih jawaban Benar atau Salah';
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
        kategori: materialData.kategori,
        kelas: materialData.kelas,
        babList: filteredBabList,
        izinkanUnduh: materialData.izinkanUnduh,
        flagAkses: materialData.flagAkses ? 1 : 0,
        quiz: [],
        sekolah: this.schoolId
      };

      const headerImage = this.selectedHeaderImage || undefined;

      this.materialService.addMaterial(finalData, headerImage).subscribe({
        next: (response) => {
          this.showSuccessToast('Materi berhasil disimpan tanpa kuis!');
          setTimeout(() => {
            this.isSubmitting = false;
            this.backToManageMaterials();
          }, 2000);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showErrorToast('Gagal menyimpan draft materi. Silakan coba lagi.');
        }
      });

    } else {
      this.materialForm.markAllAsTouched();
      this.errorMsg = 'Mohon lengkapi minimal: judul, deskripsi, kategori, dan pilih kelas untuk menyimpan draft';
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

    // Transform quiz dengan format konsisten dan logging
    const transformedQuiz = quizData.questions.map((question: any, index: number) => {

      if (question.tipeSoal === 'pilihan_ganda') {
        const filteredJawaban = question.jawaban.filter((jawab: string) => jawab && jawab.trim() !== '');

        if (question.kunci === null || question.kunci === undefined) {
          throw new Error(`Soal ${index + 1}: Kunci jawaban pilihan ganda belum dipilih`);
        }

        if (question.kunci < 0 || question.kunci >= filteredJawaban.length) {
          throw new Error(`Soal ${index + 1}: Kunci jawaban pilihan ganda tidak valid`);
        }

        return {
          jenis_soal: 'pilihan_ganda',
          soal: question.soal,
          jawaban: filteredJawaban,
          kunci: question.kunci
        };

      } else if (question.tipeSoal === 'benar_salah') {
        if (question.kunci === null || question.kunci === undefined) {
          throw new Error(`Soal ${index + 1}: Kunci jawaban benar/salah belum dipilih`);
        }

        const kunciNumber = typeof question.kunci === 'string' ? parseInt(question.kunci) : question.kunci;

        if (kunciNumber !== 0 && kunciNumber !== 1) {
          throw new Error(`Soal ${index + 1}: Kunci jawaban benar/salah tidak valid. Harus 0 (Benar) atau 1 (Salah)`);
        }

        return {
          jenis_soal: 'benar_salah',
          soal: question.soal,
          jawaban: ['Benar', 'Salah'],
          kunci: kunciNumber
        };

      } else if (question.tipeSoal === 'isian_singkat') {
        if (!question.jawabanSingkat || question.jawabanSingkat.trim() === '') {
          throw new Error(`Soal ${index + 1}: Jawaban singkat belum diisi`);
        }

        return {
          jenis_soal: 'isian_singkat',
          soal: question.soal,
          kunci_jawaban: question.jawabanSingkat.trim()
        };

      } else {
        throw new Error(`Soal ${index + 1}: Tipe soal tidak valid: ${question.tipeSoal}`);
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
      kategori: materialData.kategori,
      kelas: materialData.kelas,
      babList: filteredBabList,
      izinkanUnduh: materialData.izinkanUnduh,
      flagAkses: materialData.flagAkses ? 1 : 0,
      quiz: transformedQuiz,
      waktu_pengerjaan: quizData.waktu_pengerjaan,
      sekolah: this.schoolId
    };

    const headerImage = this.selectedHeaderImage || undefined;

    this.materialService.addMaterial(finalData, headerImage).subscribe({
      next: (response) => {
        this.showSuccessToast('Materi berhasil dibuat!');
        setTimeout(() => {
          this.isSubmitting = false;
          this.backToManageMaterials();
        }, 2000);
      },
      error: (error) => {
        this.isSubmitting = false;
        if (error.error?.message) {
          this.showErrorToast(error.error.message);
        } else if (error.message) {
          this.showErrorToast(error.message);
        } else {
          this.showErrorToast('Gagal membuat materi dengan kuis. Silakan coba lagi.');
        }
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

  showSuccessToast(message: string): void {
    this.hideToast();
    setTimeout(() => {
      this.toastMessage = message;
      this.toastClass = 'toast-success';
      this.toastIcon = 'fas fa-check-circle';
      this.showToast = true;
      this.toastTimeout = window.setTimeout(() => this.hideToast(), 3000);
    }, 100);
  }

  showErrorToast(message: string): void {
    this.hideToast();
    setTimeout(() => {
      this.toastMessage = message;
      this.toastClass = 'toast-error';
      this.toastIcon = 'fas fa-exclamation-circle';
      this.showToast = true;
      this.toastTimeout = window.setTimeout(() => this.hideToast(), 4000);
    }, 100);
  }

  hideToast(): void {
    this.showToast = false;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  ngOnDestroy(): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }
}
