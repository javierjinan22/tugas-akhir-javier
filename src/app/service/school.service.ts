import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interface untuk kelas dalam response sekolah
export interface SchoolClass {
  flag_aktif: number;
  _id: string;
  nama_kelas: string;
  tahun_ajaran: string;
  sekolah: string;
  nama_sekolah: string;
  siswa: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Interface untuk school berdasarkan response yang sesungguhnya
export interface School {
  _id: string;
  npsn: string;
  nama: string;
  owner: string;
  kelas: SchoolClass[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Interface untuk response API yang mungkin wrapped
export interface SchoolApiResponse {
  data?: School;
  message?: string;
  success?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SchoolService {
  private apiUrl = environment.apiUrl + '/literadoo/schools';

  constructor(private http: HttpClient) {}

  // Cari sekolah berdasarkan NPSN
  findSchool(npsn: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/find?npsn=${npsn}`);
  }

  // Claim sekolah (butuh JWT token)
  claimSchool(data: any, token: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/claim`, data, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    });
  }

  // Return type yang tepat berdasarkan response actual
  getMySchool(token?: string): Observable<School> {
    const jwtToken = token || localStorage.getItem('token') || '';
    return this.http.get<School>(`${this.apiUrl}/my`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${jwtToken}` })
    });
  }

  getAllSchools(): Observable<any> {
    return this.http.get(`${this.apiUrl}/all`);
  }

  getSchoolById(schoolId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${schoolId}`);
  }
}
