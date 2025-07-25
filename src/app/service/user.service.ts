import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface StudentData {
  _id: string;
  nama_lengkap: string;
  username: string;
  role: string;
  kelas: {
    _id: string;
    nama_kelas: string;
    tahun_ajaran: string;
  };
  sekolah: {
    _id: string;
    npsn: string;
    nama: string;
  };
  __v: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateClassRequest {
  newClassId: string;
}

export interface UpdateClassResponse {
  message: string;
  student: StudentData;
}

// ✨ NEW: Interface untuk response removeStudentFromAllClasses
export interface RemoveFromAllClassesResponse {
  success: boolean;
  message: string;
  data: {
    student: {
      _id: string;
      nama_lengkap: string;
      username: string;
      email: string;
      kelas: any;     // null after removal
      sekolah: any;   // null after removal
    };
    previous_class: {
      _id: string;
      nama_kelas: string;
      tahun_ajaran: string;
    } | null;
    previous_school_id: string;
  };
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = environment.apiUrl + '/literadoo/users';

  constructor(private http: HttpClient) {}

  private getHeaders(token?: string): HttpHeaders {
    const jwtToken = token || localStorage.getItem('token') || '';
    return new HttpHeaders({ 
      Authorization: `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    });
  }

  // Mengambil semua siswa berdasarkan ID sekolah
  getStudentsBySchool(schoolId: string, token?: string): Observable<StudentData[]> {
    return this.http.get<StudentData[]>(`${this.apiUrl}/students/school/${schoolId}`, {
      headers: this.getHeaders(token)
    }).pipe(
      catchError(error => {
        console.error('Error in getStudentsBySchool:', error);
        return throwError(() => error);
      })
    );
  }

  // Alternative dengan any type jika tidak yakin dengan structure
  getStudentsBySchoolSimple(schoolId: string, token?: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/students/school/${schoolId}`, {
      headers: this.getHeaders(token)
    }).pipe(
      catchError(error => {
        console.error('Error in getStudentsBySchoolSimple:', error);
        return throwError(() => error);
      })
    );
  }

  // Method sudah ada, pastikan implementasinya benar
  updateStudentClass(studentId: string, newClassId: string, token: string): Observable<UpdateClassResponse> {
    const headers = new HttpHeaders({ 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    const body: UpdateClassRequest = { newClassId };
    
    // console.log('Calling updateStudentClass API:', {
    //   studentId,
    //   newClassId,
    //   endpoint: `${this.apiUrl}/students/${studentId}/class`,
    //   body
    // });
    
    return this.http.put<UpdateClassResponse>(`${this.apiUrl}/students/${studentId}/class`, body, { headers }).pipe(
      catchError(error => {
        console.error('Error in updateStudentClass:', error);
        return throwError(() => error);
      })
    );
  }

  // ✨ NEW: Remove student from any class they're currently in
  removeStudentFromAllClasses(studentId: string, token: string): Observable<RemoveFromAllClassesResponse> {
    const headers = this.getHeaders(token);
    
    // console.log('Calling removeStudentFromAllClasses API:', {
    //   studentId,
    //   endpoint: `${this.apiUrl}/students/${studentId}/remove-from-class`
    // });
    
    return this.http.delete<RemoveFromAllClassesResponse>(
      `${this.apiUrl}/students/${studentId}/remove-from-class`, 
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Error in removeStudentFromAllClasses:', error);
        return throwError(() => error);
      })
    );
  }
}