import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface MaterialSummary {
  _id: string;
  judul_materi: string;
  deskripsi_singkat?: string;
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

  submitQuizAttempt(materiId: string, answers: any[], token?: string): Observable<any> {
    const headers = this.getHeaders(token);
    const body = { answers };

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

  getCompletedMaterials(response: MaterialsResponse): MaterialSummary[] {
    return response.data.categorized.completed;
  }

  getNotStartedMaterials(response: MaterialsResponse): MaterialSummary[] {
    return response.data.categorized.not_started;
  }

  getInProgressMaterials(response: MaterialsResponse): MaterialSummary[] {
    return response.data.categorized.in_progress;
  }
}