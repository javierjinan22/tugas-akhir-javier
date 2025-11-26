import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface MaterialSummary {
  _id: string;
  judul_materi: string;
  deskripsi_singkat?: string;
  kategori_materi: string;
  header_gambar?: string;
  total_bab: number;
  total_soal: number;
  has_quiz: boolean;
  status: 'not_started' | 'in_progress' | 'completed';
  completed_babs_count: number;
  quiz_best_score?: number;
  created_at: string;
  last_accessed?: string;
  completed_at?: string;
  flag_unduh?: boolean;
  izinkan_unduh?: number;
}

export interface MaterialsResponse {
  success: boolean;
  data: {
    student_info: {
      class_id: string;
      total_accessible_materi: number;
    };
    all_materi: MaterialSummary[];
    categorized: {
      not_started: MaterialSummary[];
      in_progress: MaterialSummary[];
      completed: MaterialSummary[];
    };
    summary: {
      total_materi: number;
      not_started: number;
      in_progress: number;
      completed: number;
    };
    // Summary berdasarkan kategori
    summary_by_kategori: {
      [kategori: string]: {
        total: number;
        not_started: number;
        in_progress: number;
        completed: number;
      };
    };
  };
}

export interface MaterialDetailResponse {
  success: boolean;
  message?: string;
  data: {
    material: {
      id: string;
      title: string;
      description: string;
      pages: Array<{
        content: string;
        isRead: boolean;
        title: string;
        pageIndex: number;
      }>;
      progress: number;
      isRead: boolean;
      quizCompleted: boolean;
      hasQuiz: boolean;
      totalPages: number;
      readPages: number;
      flag_unduh: boolean;
      waktu_pengerjaan?: number;
    };
    quiz: {
      questions: Array<{
        id: number;
        question: string;
        type: string;
        options: string[];
      }>;
      attempts: any[];
    };
  };
}

export interface MaterialCategory {
  name: string;
  materials: MaterialSummary[];
  summary: {
    total: number;
    not_started: number;
    in_progress: number;
    completed: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StudentProgressService {
  private apiUrl = environment.apiUrl + '/literadoo/student/progress';

  getApiUrl(): string {
    return this.apiUrl;
  }

  constructor(private http: HttpClient) { }

  private getHeaders(token?: string): HttpHeaders {
    const jwtToken = token || localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    });
  }

  getMateriWithProgress(token?: string): Observable<MaterialsResponse> {
    const headers = this.getHeaders(token);

    return this.http.get<MaterialsResponse>(`${this.apiUrl}/materi`, { headers }).pipe(
      catchError(error => {
        console.error('Error in getMateriWithProgress:', error);
        return throwError(() => error);
      })
    );
  }

  //  Get detail materi tertentu
  getMateriDetail(materiId: string, token?: string): Observable<any> {
    const headers = this.getHeaders(token);

    return this.http.get(`${this.apiUrl}/materi/${materiId}`, { headers }).pipe(
      catchError(error => {
        console.error('Error in getMateriDetail:', error);
        return throwError(() => error);
      })
    );
  }

  // Get materi detail untuk viewing (format frontend)
  getMateriDetailForViewing(materiId: string, token?: string): Observable<MaterialDetailResponse> {
    const headers = this.getHeaders(token);

    return this.http.get<MaterialDetailResponse>(`${this.apiUrl}/materi/${materiId}/view`, { headers }).pipe(
      catchError(error => {
        console.error('Error in getMateriDetailForViewing:', error);
        return throwError(() => error);
      })
    );
  }

  startMateriProgress(materiId: string, token?: string): Observable<any> {
    const headers = this.getHeaders(token);

    return this.http.post(`${this.apiUrl}/materi/${materiId}/start`, {}, { headers }).pipe(
      catchError(error => {
        console.error('Error in startMateriProgress:', error);
        return throwError(() => error);
      })
    );
  }

  completeBab(materiId: string, babIndex: number, token?: string): Observable<any> {
    const headers = this.getHeaders(token);

    return this.http.post(`${this.apiUrl}/materi/${materiId}/bab/${babIndex}/complete`, {}, { headers }).pipe(
      catchError(error => {
        console.error('Error in completeBab:', error);
        return throwError(() => error);
      })
    );
  }

  // submitQuizAttempt(materiId: string, answers: any[], token?: string): Observable<any> {
  //   const headers = this.getHeaders(token);
  //   const body = { answers };

  //   return this.http.post(`${this.apiUrl}/materi/${materiId}/quiz/submit`, body, { headers }).pipe(
  //     catchError(error => {
  //       console.error('Error in submitQuizAttempt:', error);
  //       return throwError(() => error);
  //     })
  //   );
  // }

  submitQuizAttempt(materiId: string, answers: any[], quizStartTime: Date, token?: string): Observable<any> {
    const headers = this.getHeaders(token);
    
    const body = { 
      answers: answers,
      started_at: quizStartTime.toISOString()  
    };

    return this.http.post(`${this.apiUrl}/materi/${materiId}/quiz/submit`, body, { headers }).pipe(
      catchError(error => {
        console.error('Error in submitQuizAttempt:', error);
        return throwError(() => error);
      })
    );
}

  updateLastAccessed(materiId: string, token?: string): Observable<any> {
    const headers = this.getHeaders(token);

    return this.http.post(`${this.apiUrl}/materi/${materiId}/update-access`, {}, { headers }).pipe(
      catchError(error => {
        console.error('Error in updateLastAccessed:', error);
        return throwError(() => error);
      })
    );
  }

  getQuizAttemptDetail(materiId: string, attemptId: string, token?: string): Observable<any> {
    const headers = this.getHeaders(token);

    return this.http.get(`${this.apiUrl}/materi/${materiId}/quiz/attempts/${attemptId}`, { headers }).pipe(
      catchError(error => {
        console.error('Error in getQuizAttemptDetail:', error);
        return throwError(() => error);
      })
    );
  }

  getStudiedMaterials(response: MaterialsResponse): MaterialSummary[] {
    return [...response.data.categorized.not_started, ...response.data.categorized.in_progress];
  }

  getStudiedMaterialsByCategory(response: any): MaterialCategory[] {
  const studiedMaterials = this.getStudiedMaterials(response);
  const categoryData = response.data.summary_by_kategori || {};
  
  // Group materials by category
  const groupedMaterials = studiedMaterials.reduce((acc, material) => {
    const category = material.kategori_materi || 'Tidak Berkategori';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(material);
    return acc;
  }, {} as { [key: string]: MaterialSummary[] });

  // Convert to MaterialCategory array
  return Object.keys(groupedMaterials).map(categoryName => ({
    name: categoryName,
    materials: groupedMaterials[categoryName],
    summary: categoryData[categoryName] || {
      total: groupedMaterials[categoryName].length,
      not_started: 0,
      in_progress: groupedMaterials[categoryName].length,
      completed: 0
    }
  }));
}

  getCompletedMaterials(response: MaterialsResponse): MaterialSummary[] {
    return response.data.categorized.completed;
  }

  getCompletedMaterialsByCategory(response: any): MaterialCategory[] {
  const completedMaterials = this.getCompletedMaterials(response);
  const categoryData = response.data.summary_by_kategori || {};
  
  // Group materials by category
  const groupedMaterials = completedMaterials.reduce((acc, material) => {
    const category = material.kategori_materi || 'Tidak Berkategori';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(material);
    return acc;
  }, {} as { [key: string]: MaterialSummary[] });

  // Convert to MaterialCategory array
  return Object.keys(groupedMaterials).map(categoryName => ({
    name: categoryName,
    materials: groupedMaterials[categoryName],
    summary: categoryData[categoryName] || {
      total: groupedMaterials[categoryName].length,
      not_started: 0,
      in_progress: 0,
      completed: groupedMaterials[categoryName].length
    }
  }));
}

  getNotStartedMaterials(response: MaterialsResponse): MaterialSummary[] {
    return response.data.categorized.not_started;
  }

  getInProgressMaterials(response: MaterialsResponse): MaterialSummary[] {
    return response.data.categorized.in_progress;
  }

  getMaterialsByKategori(response: MaterialsResponse, kategori: string): MaterialSummary[] {
    return response.data.all_materi.filter(material => material.kategori_materi === kategori);
  }

  // Get available categories
  getAvailableKategori(response: MaterialsResponse): string[] {
    const categories = [...new Set(response.data.all_materi.map(material => material.kategori_materi))];
    return categories.sort();
  }

  // Get summary by kategori
  getSummaryByKategori(response: MaterialsResponse): { [kategori: string]: any } {
    return response.data.summary_by_kategori || {};
  }

  // Filter materials by kategori and status
  getFilteredMaterials(
    response: MaterialsResponse, 
    kategori?: string, 
    status?: 'not_started' | 'in_progress' | 'completed'
  ): MaterialSummary[] {
    let materials = response.data.all_materi;

    if (kategori) {
      materials = materials.filter(material => material.kategori_materi === kategori);
    }

    if (status) {
      materials = materials.filter(material => material.status === status);
    }

    return materials;
  }

  downloadMaterialPdf(materiId: string, token?: string): Observable<Blob> {
    const headers = this.getHeaders(token);
    
    return this.http.get(`${this.apiUrl}/materi/${materiId}/download/pdf`, { 
      headers, 
      responseType: 'blob' 
    }).pipe(
      catchError(error => {
        console.error('Error in downloadMaterialPdf:', error);
        return throwError(() => error);
      })
    );
  }

  downloadQuizPdf(materiId: string, token?: string): Observable<Blob> {
    const headers = this.getHeaders(token);
    
    return this.http.get(`${this.apiUrl}/materi/${materiId}/quiz/download/pdf`, { 
      headers, 
      responseType: 'blob' 
    }).pipe(
      catchError(error => {
        console.error('Error in downloadQuizPdf:', error);
        return throwError(() => error);
      })
    );
  }

  downloadQuizAttemptPdf(materiId: string, attemptId: string, token?: string): Observable<Blob> {
    const headers = this.getHeaders(token);
    
    return this.http.get(`${this.apiUrl}/materi/${materiId}/quiz/attempts/${attemptId}/download/pdf`, { 
      headers, 
      responseType: 'blob' 
    }).pipe(
      catchError(error => {
        console.error('Error in downloadQuizAttemptPdf:', error);
        return throwError(() => error);
      })
    );
  }

  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}