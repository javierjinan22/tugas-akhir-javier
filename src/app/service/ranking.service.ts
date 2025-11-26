import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

// Interface untuk School Ranking
export interface SchoolRanking {
  _id: string;
  nama: string;
  npsn: string;
  lokasi: {
    propinsi: string;
    kabupaten_kota: string;
    kecamatan: string;
    alamat_jalan: string;
  };
  statistik: {
    total_siswa: number;
    total_guru: number;
    total_materi: number;
    avg_penyelesaian: number;
    avg_nilai: number;
    score: number;
  };
  peringkat: number;
}

export interface SchoolRankingResponse {
  success: boolean;
  data: {
    filter_info: {
      filter: string;
      value: string;
    };
    schools: SchoolRanking[];
    total_schools: number;
    showing: number;
  };
  message?: string;
}

// Interface untuk Student Ranking
export interface StudentRanking {
  student_id: string;
  nama_siswa: string;
  username: string;
  kelas_info: {
    _id: string;
    nama_kelas: string;
    tahun_ajaran: string;
  };
  materi_selesai: number;
  total_materi: number;
  penyelesaian: number;
  rata_rata_nilai: number;
  total_skor: number;
  medali: 'gold' | 'silver' | 'bronze' | 'none';
  peringkat: number;
}

export interface StudentRankingResponse {
  success: boolean;
  data: {
    guru_info: {
      nama: string;
    };
    sekolah_info: {
      _id: string;
      nama: string;
    };
    kelas_filter: string;
    kategori_filter: string;
    statistics: {
      total_siswa: number;
      rata_rata_penyelesaian: number;
      rata_rata_nilai: number;
    };
    students: StudentRanking[];
    total_students: number;
  };
  message?: string;
}

// Interface untuk Locations
export interface LocationsResponse {
  success: boolean;
  data: {
    provinsi?: string[];
    kabupaten_kota?: string[];
    kecamatan?: string[];
  };
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RankingService {

  private apiUrl = environment.apiUrl + '/literadoo/rankings';

  constructor(private http: HttpClient) {
    // console.log('Ranking Service initialized with URL:', this.apiUrl);
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Get School Rankings (Public)
  getSchoolRankings(
    filter?: string, 
    value?: string, 
    limit?: number, 
    page?: number
  ): Observable<SchoolRankingResponse> {
    
    let params = new HttpParams();
    
    if (filter) params = params.set('filter', filter);
    if (value) params = params.set('value', value);
    if (limit) params = params.set('limit', limit.toString());
    if (page) params = params.set('page', page.toString());

    console.log(' Getting school rankings with params:', params.toString());

    return this.http.get<SchoolRankingResponse>(`${this.apiUrl}/schools`, { params });
  }

  // Get Student Rankings (Requires Auth)
  getStudentRankings(
    kelasId?: string, 
    kategori?: string
  ): Observable<StudentRankingResponse> {
    
    const headers = this.getAuthHeaders();
    let params = new HttpParams();
    
    if (kelasId) params = params.set('kelas_id', kelasId);
    if (kategori) params = params.set('kategori', kategori);

    console.log('👥 Getting student rankings with params:', params.toString());

    return this.http.get<StudentRankingResponse>(`${this.apiUrl}/students`, { 
      headers, 
      params 
    });
  }

  // Get Locations for Dropdown (Public)
  getLocations(type: 'provinsi' | 'kabupaten_kota' | 'kecamatan'): Observable<LocationsResponse> {
    let params = new HttpParams();
    params = params.set('type', type);

    console.log('📍 Getting locations for:', type);

    return this.http.get<LocationsResponse>(`${this.apiUrl}/locations`, { params });
  }

  // Helper method untuk mendapatkan provinsi
  getProvinsi(): Observable<LocationsResponse> {
    return this.getLocations('provinsi');
  }

  // Helper method untuk mendapatkan kabupaten/kota
  getKabupatenKota(): Observable<LocationsResponse> {
    return this.getLocations('kabupaten_kota');
  }

  // Helper method untuk mendapatkan kecamatan
  getKecamatan(): Observable<LocationsResponse> {
    return this.getLocations('kecamatan');
  }
}