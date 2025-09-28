import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Interfaces untuk response data
export interface StudentInfo {
  _id: string;
  nama: string;
  kelas: string;
  sekolah: string;
}

export interface MedalData {
  total_materi: number;
  completed_materi: number;
  avg_score: number;
  completion_rate: number;
  medal_level: 'gold' | 'silver' | 'bronze' | 'none';
}

export interface OverallStats {
  total_materi: number;
  completed_materi: number;
  overall_avg_score: number;
  overall_medal_level: 'gold' | 'silver' | 'bronze' | 'none';
}

export interface AchievementsResponse {
  success: boolean;
  data: {
    student_info: StudentInfo;
    medals: {
      [key: string]: MedalData;
    };
    overall_stats: OverallStats;
  };
}

export interface StudentRanking {
  student_id: string;
  nama_siswa: string;
  username: string;
  score: number;
  completed_materi: number;
  total_materi: number;
  completion_rate: number;
  avg_duration_seconds: number;
  avg_attempts: number;
  total_attempts: number;  
  ranking_score: number;
  ranking_attempts: number;
  ranking_duration: number;
  medal_level: string;
  rank: number;
}

export interface CurrentStudent {
  student_id: string;
  nama_siswa: string;
  score: number;
  rank: number;
}

export interface RankingsResponse {
  success: boolean;
  data: {
    kategori: string;
    kelas_info: {
      _id: string;
      nama_kelas: string;
    };
    current_student: StudentRanking;
    rankings: StudentRanking[];
    total_students: number; 
  };
}

export interface FeedbackItem {
  _id: string;
  materi_id: string; 
  judul_materi: string;
  kategori_materi: string;
  feedback_text: string;
  guru_name: string;
  is_read: boolean;
  created_at: string;
}

export interface FeedbackResponse {
  success: boolean;
  data: {
    feedbacks: FeedbackItem[];
    total_feedback: number;
    unread_count: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class LearningHistoryService {
  private apiUrl = environment.apiUrl + '/literadoo/learning-history';

  constructor(private http: HttpClient) { }

  private getHeaders(token?: string): HttpHeaders {
    const authToken = token || localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': authToken ? `Bearer ${authToken}` : ''
    });
  }

  // GET /api/learning-history/achievements
  getStudentAchievements(token?: string): Observable<AchievementsResponse> {
    const headers = this.getHeaders(token);

    return this.http.get<AchievementsResponse>(`${this.apiUrl}/achievements`, { headers }).pipe(
      catchError(error => {
        console.error('Error in getStudentAchievements:', error);
        return throwError(() => error);
      })
    );
  }

  // GET /api/learning-history/rankings?kategori=all
  getStudentRankings(kategori: string = 'all', token?: string): Observable<RankingsResponse> {
    const headers = this.getHeaders(token);
    const params = `?kategori=${encodeURIComponent(kategori)}`;

    return this.http.get<RankingsResponse>(`${this.apiUrl}/rankings${params}`, { headers }).pipe(
      catchError(error => {
        console.error('Error in getStudentRankings:', error);
        return throwError(() => error);
      })
    );
  }

  // GET /api/learning-history/feedback
  getStudentFeedback(token?: string): Observable<FeedbackResponse> {
    const headers = this.getHeaders(token);

    return this.http.get<FeedbackResponse>(`${this.apiUrl}/feedback`, { headers }).pipe(
      catchError(error => {
        console.error('Error in getStudentFeedback:', error);
        return throwError(() => error);
      })
    );
  }
}