import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';


export interface ClassSummary {
  _id: string;
  nama_kelas: string;
  tahun_ajaran: string;
  nama_sekolah: string;
  jumlah_siswa: number;
  materi_tertaut: number;
}

export interface ClassesSummaryResponse {
  success: boolean;
  data: ClassSummary[];
  total: number;
  sekolah_info: {
    id: string;
    nama: string;
    npsn: string;
  };
  guru_info: {
    nama: string;
  };
  message?: string;
}

export interface MaterialProgress {
  _id: string;
  judul_materi: string;
  kategori_materi: string;
  total_bab: number;
  total_soal: number;
  has_quiz: boolean;
  siswa_selesai: number;
  total_siswa: number;
  persentase_selesai: number;
  created_at: Date;
}

export interface ClassMaterialsProgressResponse {
  success: boolean;
  data: {
    kelas_info: {
      _id: string;
      nama_kelas: string;
      tahun_ajaran: string;
      nama_sekolah: string;
      total_siswa: number;
    };
    materi_list: MaterialProgress[];
  };
  message?: string;
}

export interface StudentProgress {
  _id: string;
  nama_siswa: string;
  username: string;
  kelas: {
    _id: string;
    nama_kelas: string;
    tahun_ajaran: string;
  };
  status: 'completed' | 'in_progress' | 'not_started';
  completed_babs: number;
  total_babs: number;
  quiz_attempts: number;
  nilai: number | null;
  best_score: number | null;
  last_accessed: Date | null;
  started_at: Date | null;
  completed_at: Date | null;
}

export interface MaterialStudentsProgressResponse {
  success: boolean;
  data: {
    materi_info: {
      _id: string;
      judul_materi: string;
      kategori_materi: string;
      total_bab: number;
      total_soal: number;
      has_quiz: boolean;
    };
    students: StudentProgress[];
    statistics: {
      total_siswa: number;
      not_started: number;
      in_progress: number;
      completed: number;
      has_quiz_score: number;
      avg_score: number;
    };
  };
  message?: string;
}

export interface StudentQuizResultResponse {
  success: boolean;
  data: {
    student_info: {
      _id: string;
      nama_siswa: string;
      username: string;
      kelas: {
        _id: string;
        nama_kelas: string;
        tahun_ajaran: string;
      };
    };
    materi_info: {
      _id: string;
      judul_materi: string;
      kategori_materi: string;
      total_bab: number;
      total_soal: number;
      has_quiz: boolean;
    };
    quiz_attempt: {
      attempt_number: number;
      completed_at: string;
      score: number;
      total_questions: number;
      detailed_answers: Array<{
        question_index: number;
        question_data: {
          question: string;
          type: string;
          options: string[];
          correct_answer: string;
        };
        student_answer: string;
        is_correct: boolean;
      }>;
    };
  };
  message?: string;
}

export interface FeedbackPayload {
  student_id: string;
  materi_id: string;
  feedback_text: string;
}

export interface SendFeedbackResponse {
  success: boolean;
  message: string;
  data: {
    feedback_id: string;
    student_name: string;
    materi_title: string;
    sent_at: Date;
  };
}

export interface AllMaterialsProgressResponse {
  success: boolean;
  data: {
    sekolah_info: {
      id: string;
      nama: string;
      npsn: string;
    };
    guru_info: {
      nama: string;
    };
    kelas_list: Array<{
      _id: string;
      nama_kelas: string;
      tahun_ajaran: string;
      total_siswa: number;
    }>;
    tahun_ajaran_list: string[];
    kategori_list: string[];
    materials: Array<MaterialProgress & {
      kelas_info: {
        _id: string;
        nama_kelas: string;
        tahun_ajaran: string;
        total_siswa: number;
      };
    }>;
  };
  message?: string;
}

export interface StudentFeedback {
  _id: string;
  student_id: string;
  materi_id: string;
  guru_id: string; 
  feedback_text: string;
  is_read: boolean;  
  createdAt: Date; 
  updatedAt: Date; 
  __v: number;      
}

export interface GetStudentFeedbackResponse {
  success: boolean;
  data: StudentFeedback[]; 
  total: number;          
  latest: StudentFeedback; 
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeacherProgressService {

    private apiUrl = environment.apiUrl + '/literadoo/teacher/progress';

  constructor(private http: HttpClient) { }

  // ✅ Helper method untuk get headers dengan token
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ✅ GET /api/teacher-progress/classes-summary
  // Mendapatkan ringkasan kelas yang memiliki materi dari guru
  getClassesSummary(): Observable<ClassesSummaryResponse> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ClassesSummaryResponse>(
      `${this.apiUrl}/classes-summary`,
      { headers }
    );
  }

   getAllMaterialsProgress(filters?: {
    kelas_id?: string;
    tahun_ajaran?: string;
    kategori?: string;
  }): Observable<AllMaterialsProgressResponse> {
    const headers = this.getAuthHeaders();
    
    let params = '';
    if (filters) {
      const queryParams = new URLSearchParams();
      if (filters.kelas_id && filters.kelas_id !== 'all') {
        queryParams.append('kelas_id', filters.kelas_id);
      }
      if (filters.tahun_ajaran && filters.tahun_ajaran !== 'all') {
        queryParams.append('tahun_ajaran', filters.tahun_ajaran);
      }
      if (filters.kategori && filters.kategori !== 'all') {
        queryParams.append('kategori', filters.kategori);
      }
      params = queryParams.toString() ? `?${queryParams.toString()}` : '';
    }
    
    return this.http.get<AllMaterialsProgressResponse>(
      `${this.apiUrl}/all-materials-progress${params}`,
      { headers }
    );
  }

  // ✅ GET /api/teacher-progress/classes/:classId/materials
  // Mendapatkan daftar materi dan progress per kelas
  getClassMaterialsProgress(classId: string): Observable<ClassMaterialsProgressResponse> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ClassMaterialsProgressResponse>(
      `${this.apiUrl}/classes/${classId}/materials`,
      { headers }
    );
  }

  // GET /api/teacher-progress/classes/:classId/materials/:materiId/students
  // Mendapatkan progress siswa untuk materi tertentu dalam kelas tertentu
  getMaterialStudentsProgress(classId: string, materiId: string): Observable<MaterialStudentsProgressResponse> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<MaterialStudentsProgressResponse>(
      `${this.apiUrl}/classes/${classId}/materials/${materiId}/students`,
      { headers }
    );
  }

  // ✅ POST /api/teacher-progress/feedback
  // Mengirim feedback ke siswa
  sendStudentFeedback(feedbackData: FeedbackPayload): Observable<SendFeedbackResponse> {
    const headers = this.getAuthHeaders();
    
    return this.http.post<SendFeedbackResponse>(
      `${this.apiUrl}/feedback`,
      feedbackData,
      { headers }
    );
  }

  // Method untuk mendapatkan feedback yang sudah dikirim
getStudentFeedback(studentId: string, materiId: string): Observable<GetStudentFeedbackResponse> {
  const headers = this.getAuthHeaders();
  
  const params = new URLSearchParams();
  params.append('student_id', studentId);
  params.append('materi_id', materiId);
  
  return this.http.get<GetStudentFeedbackResponse>(
    `${this.apiUrl}/feedback?${params.toString()}`,
    { headers }
  );
}

  // Get progress percentage untuk materi
  getMateriProgressPercentage(siswa_selesai: number, total_siswa: number): number {
    if (total_siswa === 0) return 0;
    return Math.round((siswa_selesai / total_siswa) * 100);
  }

  // Get bab completion percentage
  getBabCompletionPercentage(completed_babs: number, total_babs: number): number {
    if (total_babs === 0) return 0;
    return Math.round((completed_babs / total_babs) * 100);
  }

  // Get progress color berdasarkan persentase
  getProgressColor(percentage: number): string {
    if (percentage >= 80) return '#28a745'; // Green - Sangat Baik
    if (percentage >= 60) return '#17a2b8'; // Blue - Baik
    if (percentage >= 40) return '#ffc107'; // Yellow - Cukup
    if (percentage >= 20) return '#fd7e14'; // Orange - Kurang
    return '#dc3545'; // Red - Sangat Kurang
  }

  // Get progress text berdasarkan persentase
  getProgressText(percentage: number): string {
    if (percentage >= 80) return 'Sangat Baik';
    if (percentage >= 60) return 'Baik';
    if (percentage >= 40) return 'Cukup';
    if (percentage >= 20) return 'Kurang';
    return 'Sangat Kurang';
  }

  // Get student status badge class sesuai status backend
  getStudentStatusBadge(status: string): { class: string; text: string } {
    switch (status) {
      case 'completed':
        return { class: 'badge bg-success', text: 'Selesai' };
      case 'in_progress':
        return { class: 'badge bg-warning text-dark', text: 'Sedang Belajar' };
      case 'not_started':
        return { class: 'badge bg-secondary', text: 'Belum Mulai' };
      default:
        return { class: 'badge bg-light text-dark', text: 'Tidak Diketahui' };
    }
  }

  // Get kategori materi icon
  getKategoriMateriIcon(kategori: string): string {
    switch (kategori.toLowerCase()) {
      case 'reading':
      case 'membaca':
        return 'fas fa-book-reader';
      case 'listening':
      case 'mendengar':
        return 'fas fa-headphones';
      case 'speaking':
      case 'berbicara':
        return 'fas fa-microphone';
      case 'writing':
      case 'menulis':
        return 'fas fa-pen';
      case 'grammar':
      case 'tata bahasa':
        return 'fas fa-language';
      case 'vocabulary':
      case 'kosakata':
        return 'fas fa-spell-check';
      default:
        return 'fas fa-book';
    }
  }

  // Format nilai untuk display
  formatNilai(nilai: number | null): string {
    if (nilai === null) return '-';
    return nilai.toString();
  }

  // Format tanggal untuk display
  formatDate(date: Date | string | null): string {
    if (!date) return '-';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Format tanggal singkat (tanpa jam)
  formatDateShort(date: Date | string | null): string {
    if (!date) return '-';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  // Calculate average completion untuk kelas
  calculateClassAverage(materials: MaterialProgress[]): number {
    if (materials.length === 0) return 0;
    
    const total = materials.reduce((sum, material) => sum + material.persentase_selesai, 0);
    return Math.round(total / materials.length);
  }

  // Sort classes by different criteria
  sortClasses(classes: ClassSummary[], sortBy: 'name' | 'students' | 'materials'): ClassSummary[] {
    return [...classes].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.nama_kelas.localeCompare(b.nama_kelas);
        case 'students':
          return b.jumlah_siswa - a.jumlah_siswa;
        case 'materials':
          return b.materi_tertaut - a.materi_tertaut;
        default:
          return 0;
      }
    });
  }

  // Sort materials by different criteria
  sortMaterials(materials: MaterialProgress[], sortBy: 'name' | 'progress' | 'date'): MaterialProgress[] {
    return [...materials].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.judul_materi.localeCompare(b.judul_materi);
        case 'progress':
          return b.persentase_selesai - a.persentase_selesai;
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
  }

  // Sort students by different criteria
  sortStudents(students: StudentProgress[], sortBy: 'name' | 'status' | 'progress' | 'score'): StudentProgress[] {
    return [...students].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.nama_siswa.localeCompare(b.nama_siswa);
        case 'status':
          const statusOrder = { 'completed': 0, 'in_progress': 1, 'not_started': 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        case 'progress':
          const aProgress = this.getBabCompletionPercentage(a.completed_babs, a.total_babs);
          const bProgress = this.getBabCompletionPercentage(b.completed_babs, b.total_babs);
          return bProgress - aProgress;
        case 'score':
          const aScore = a.nilai || 0;
          const bScore = b.nilai || 0;
          return bScore - aScore;
        default:
          return 0;
      }
    });
  }

  // Filter students by status
  filterStudentsByStatus(students: StudentProgress[], status: string): StudentProgress[] {
    if (status === 'all') return students;
    return students.filter(student => student.status === status);
  }

  // Search students by name or username
  searchStudents(students: StudentProgress[], searchTerm: string): StudentProgress[] {
    if (!searchTerm || searchTerm.trim() === '') {
      return students;
    }
    
    const term = searchTerm.toLowerCase().trim();
    return students.filter(student => 
      student.nama_siswa.toLowerCase().includes(term) ||
      student.username.toLowerCase().includes(term)
    );
  }

  // Filter materials by kategori
  filterMaterialsByKategori(materials: MaterialProgress[], kategori: string): MaterialProgress[] {
    if (kategori === 'all') return materials;
    return materials.filter(material => material.kategori_materi === kategori);
  }

  // Validate feedback data
  validateFeedback(feedback: FeedbackPayload): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!feedback.student_id || feedback.student_id.trim() === '') {
      errors.push('Student ID harus diisi');
    }

    if (!feedback.materi_id || feedback.materi_id.trim() === '') {
      errors.push('Materi ID harus diisi');
    }

    if (!feedback.feedback_text || feedback.feedback_text.trim() === '') {
      errors.push('Feedback harus diisi');
    }

    if (feedback.feedback_text && feedback.feedback_text.trim().length < 10) {
      errors.push('Feedback minimal 10 karakter');
    }

    if (feedback.feedback_text && feedback.feedback_text.length > 1000) {
      errors.push('Feedback tidak boleh lebih dari 1000 karakter');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get unique kategoris from materials
  getUniqueKategoris(materials: MaterialProgress[]): string[] {
    const kategoris = materials.map(material => material.kategori_materi);
    return [...new Set(kategoris)].sort();
  }

  // Get statistics summary for dashboard
  getStatisticsSummary(classes: ClassSummary[]) {
    return {
      total_classes: classes.length,
      total_students: classes.reduce((sum, cls) => sum + cls.jumlah_siswa, 0),
      total_materials: classes.reduce((sum, cls) => sum + cls.materi_tertaut, 0),
      avg_students_per_class: classes.length > 0 ? 
        Math.round(classes.reduce((sum, cls) => sum + cls.jumlah_siswa, 0) / classes.length) : 0,
      avg_materials_per_class: classes.length > 0 ? 
        Math.round(classes.reduce((sum, cls) => sum + cls.materi_tertaut, 0) / classes.length) : 0
    };
  }

  // Mendapatkan detail hasil quiz siswa untuk guru
  getStudentQuizResult(classId: string, materiId: string, studentId: string): Observable<StudentQuizResultResponse> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<StudentQuizResultResponse>(
      `${this.apiUrl}/classes/${classId}/materials/${materiId}/students/${studentId}/quiz-result`,
      { headers }
    );
  }
}