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

export interface ClaimSchoolPayload {
  npsn: string;
  sekolah: string;
  kode_prop?: string;
  propinsi?: string;
  kode_kab_kota?: string;
  kabupaten_kota?: string;
  kode_kec?: string;
  kecamatan?: string;
  alamat_jalan?: string;
  lintang?: string;
  bujur?: string;
  bentuk?: string;
  status?: string;
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
  claimSchool(payload: ClaimSchoolPayload, token: string): Observable<any> {
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  return this.http.put(`${this.apiUrl}/claim`, payload, { headers });
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
