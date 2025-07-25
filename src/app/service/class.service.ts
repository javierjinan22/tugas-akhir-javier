import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export interface Student {
  _id: string;
  nama_lengkap: string;
  username: string;
  email?: string;
  createdAt?: string;
}

export interface ClassInfo {
  _id: string;
  nama_kelas: string;
  tahun_ajaran: string;
  sekolah: {
    _id: string;
    nama: string;
    npsn: string;
    alamat?: string;
  };
  total_siswa: number;
  flag_aktif: number; // 1 = aktif, 0 = non-aktif
  archived_at?: string | null; // tanggal arsip, null jika tidak diarsipkan
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentsResponse {
  success: boolean;
  data: {
    kelas: ClassInfo;
    siswa: Student[];
  };
  message: string;
}

// Interface untuk response getClassesBySchool
export interface ClassesBySchoolResponse {
  success: boolean;
  data: any[];
  total: number;
}

// ✨ UPDATE: Interface untuk response removeStudentFromClass
export interface RemoveStudentResponse {
  success: boolean;
  message: string;
  data: {
    updated_class: {
      _id: string;
      nama_kelas: string;
      tahun_ajaran: string;
      sekolah: {
        _id: string;
        nama: string;
        npsn: string;
      };
      total_siswa: number;
    };
    removed_student: {
      _id: string;
      nama_lengkap: string;
      username: string;
      email: string;
      kelas: any;     // null after removal
      sekolah: any;   // null after removal
    };
  };
}

@Injectable({ providedIn: 'root' })
export class ClassService {
  private apiUrl = environment.apiUrl + '/literadoo/classes';

  constructor(private http: HttpClient) {}

  // ✨ Helper method untuk headers
  private getHeaders(token?: string): HttpHeaders {
    const jwtToken = token || localStorage.getItem('token') || '';
    return new HttpHeaders({ 
      Authorization: `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    });
  }

  addClass(data: any, token: string) {
    return this.http.post(`${this.apiUrl}/add`, data, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    });
  }

  getStudentsInClass(classId: string, token?: string): Observable<StudentsResponse> {
    const headers = token ? 
      new HttpHeaders({ 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }) : 
      new HttpHeaders({ 'Content-Type': 'application/json' });
    
    return this.http.get<StudentsResponse>(`${this.apiUrl}/${classId}/students`, { headers });
  }

  // Alternative fungsi jika response format berbeda
  getStudentsInClassSimple(classId: string, token?: string): Observable<any> {
    const headers = token ? 
      new HttpHeaders({ 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }) : 
      new HttpHeaders({ 'Content-Type': 'application/json' });
    
    return this.http.get<any>(`${this.apiUrl}/${classId}/students`, { headers });
  }
  
  getClassesBySchool(idSekolah: string, token?: string): Observable<ClassesBySchoolResponse> {
    const headers = token ? 
      new HttpHeaders({ Authorization: `Bearer ${token}` }) : 
      new HttpHeaders();
    
    return this.http.get<ClassesBySchoolResponse>(`${this.apiUrl}/by-school/${idSekolah}`, { headers });
  }

  getClassById(classId: string, token?: string): Observable<any> {
    const headers = token ? 
      new HttpHeaders({ Authorization: `Bearer ${token}` }) : 
      new HttpHeaders();
    
    return this.http.get(`${this.apiUrl}/${classId}`, { headers });
  }

  // ✨ UPDATE: Perbaiki dengan interface yang tepat dan error handling
  removeStudentFromClass(classId: string, studentId: string, token: string): Observable<RemoveStudentResponse> {
    const headers = this.getHeaders(token);
    
    // console.log('Calling removeStudentFromClass API:', {
    //   classId,
    //   studentId,
    //   endpoint: `${this.apiUrl}/${classId}/students/${studentId}`
    // });
    
    return this.http.delete<RemoveStudentResponse>(`${this.apiUrl}/${classId}/students/${studentId}`, { headers }).pipe(
      catchError(error => {
        console.error('Error in removeStudentFromClass:', error);
        return throwError(() => error);
      })
    );
  }

  toggleClassStatus(classId: string, flagAktif: number, token: string): Observable<any> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const body = { flag_aktif: flagAktif };
    
    return this.http.put(`${this.apiUrl}/${classId}/status`, body, { headers });
  }

  getActiveClassesBySchool(schoolId: string, token?: string): Observable<any> {
    const headers = token ? 
      new HttpHeaders({ Authorization: `Bearer ${token}` }) : 
      new HttpHeaders();
    
    return this.http.get(`${this.apiUrl}/by-school/${schoolId}/active`, { headers });
  }

  getClassesBySchoolWithStatus(schoolId: string, status?: number, token?: string): Observable<any> {
    const headers = token ? 
      new HttpHeaders({ Authorization: `Bearer ${token}` }) : 
      new HttpHeaders();
      
    let url = `${this.apiUrl}/by-school/${schoolId}`;
    if (status !== undefined) {
      url += `?status=${status}`;
    }
    
    return this.http.get(url, { headers });
  }

  updateClass(classId: string, classData: { nama_kelas: string, tahun_ajaran: string }, token: string): Observable<any> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    
    return this.http.put(`${this.apiUrl}/${classId}`, classData, { headers });
  }

  deleteClass(classId: string, permanent: boolean = false, token: string): Observable<any> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const params = permanent ? '?permanent=true' : '';
    
    return this.http.delete(`${this.apiUrl}/${classId}${params}`, { headers });
  }

  restoreClass(classId: string, token: string): Observable<any> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    
    return this.http.put(`${this.apiUrl}/${classId}/restore`, {}, { headers });
  }
}