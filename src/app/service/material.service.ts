import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ClassService } from './class.service';

export interface MaterialQuestion {
  _id: string;
  jenis_soal: 'pilihan_ganda' | 'isian_singkat' | 'benar_salah';
  soal: string;
  jawaban?: any[];
  kunci_jawaban: string;
}

export interface Material {
  _id: string;
  judul_materi: string;
  deskripsi_singkat: string;
  kategori_materi?: string;
  header_gambar?: string;
  kelas_ditautkan: string[];
  kelas_names?: string[];
  isian_materi: string;
  flag_unduh: boolean;
  soal: MaterialQuestion[];
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  waktu_pengerjaan?: number;
}

export interface MaterialsResponse {
  success: boolean;
  data: Material[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface MaterialStatsResponse {
  success: boolean;
  data: {
    total_materi: number;
    materi_aktif: number;
    materi_tidak_aktif: number;
    total_soal: number;
    kelas_tertaut: number;
  };
}

@Injectable({ providedIn: 'root' })
export class MaterialService {
  private apiUrl = environment.apiUrl + '/literadoo/materi';

  constructor(
    private http: HttpClient,
    private classService: ClassService
  ) { }

  // ✨ Helper method untuk headers
  private getHeaders(token?: string): HttpHeaders {
    const jwtToken = token || localStorage.getItem('token') || '';
    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    });
  }

  private createFormDataForMaterial(materialData: any, headerImage: File): FormData {
  const formData = new FormData();
  
  // ✅ KRITICAL: Append file dengan nama field yang sesuai backend expectation
  formData.append('header_gambar', headerImage);
  
  // ✅ APPEND: Semua field material data secara individual (bukan sebagai JSON)
  // Backend controller expects individual fields, not nested JSON
  
  if (materialData.judul) formData.append('judul', materialData.judul);
  if (materialData.deskripsi) formData.append('deskripsi', materialData.deskripsi);
  if (materialData.kategori) formData.append('kategori', materialData.kategori);
  if (materialData.sekolah) formData.append('sekolah', materialData.sekolah);
  
  // ✅ Arrays dan Objects harus di-stringify
  if (materialData.kelas && Array.isArray(materialData.kelas)) {
    formData.append('kelas', JSON.stringify(materialData.kelas));
  }
  
  if (materialData.babList && Array.isArray(materialData.babList)) {
    formData.append('babList', JSON.stringify(materialData.babList));
  }
  
  if (materialData.quiz && Array.isArray(materialData.quiz)) {
    formData.append('quiz', JSON.stringify(materialData.quiz));
  }
  
  // ✅ Boolean dan Number values
  if (materialData.izinkanUnduh !== undefined) {
    formData.append('izinkanUnduh', materialData.izinkanUnduh.toString());
  }
  
  if (materialData.waktu_pengerjaan) {
    formData.append('waktu_pengerjaan', materialData.waktu_pengerjaan.toString());
  }
  
  return formData;
}

  addMaterial(materialData: any, headerImage?: File): Observable<any> {
  if (headerImage) {
    // ✅ Kirim sebagai FormData multipart untuk file upload
    const formData = this.createFormDataForMaterial(materialData, headerImage);
    const headers = this.getMultipartHeaders();

    return this.http.post(`${this.apiUrl}`, formData, { headers }).pipe(
      catchError(error => {
        console.error('Error in addMaterial with file:', error);
        return throwError(() => error);
      })
    );
  } else {
    // ✅ Kirim sebagai JSON biasa jika tidak ada file
    const headers = this.getHeaders();
    return this.http.post(`${this.apiUrl}`, materialData, { headers }).pipe(
      catchError(error => {
        console.error('Error in addMaterial:', error);
        return throwError(() => error);
      })
    );
  }
}



  private buildFormData(materialData: any, headerImage: File): FormData {
  const formData = new FormData();
  
  formData.append('headerImage', headerImage);
  formData.append('materialData', JSON.stringify(materialData));
  
  return formData;
}

  private getMultipartHeaders(token?: string): HttpHeaders {
  const jwtToken = token || localStorage.getItem('token') || '';
  
  // ✅ CRITICAL: Jangan set Content-Type untuk multipart
  // Browser akan set Content-Type: multipart/form-data dengan boundary otomatis
  return new HttpHeaders({
    'Authorization': `Bearer ${jwtToken}`
    // ✅ JANGAN tambahkan 'Content-Type': browser yang handle
  });
}

  // ✅ SESUAI: router.get('/my-materi', auth, isGuru, materiController.getAllMateri);
  getMyMaterials(token?: string): Observable<MaterialsResponse> {
    const headers = this.getHeaders(token);

    return this.http.get<MaterialsResponse>(`${this.apiUrl}/my-materi`, { headers }).pipe(
      map((response: MaterialsResponse) => {
        // Map class IDs to class names untuk setiap material
        if (response.success && response.data) {
          response.data = response.data.map(material => ({
            ...material,
            kelas_names: [] // Initialize empty, akan diisi oleh component
          }));
        }
        return response;
      }),
      catchError(error => {
        console.error('Error in getMyMaterials:', error);
        return throwError(() => error);
      })
    );
  }

  getKategoriList(token?: string): Observable<any> {
    const headers = this.getHeaders(token);

    return this.http.get(`${this.apiUrl}/kategori/list`, { headers }).pipe(
      catchError(error => {
        console.error('Error in getKategoriList:', error);
        return throwError(() => error);
      })
    );
  }

  // ✅ SESUAI: router.get('/stats', auth, isGuru, materiController.getMateriStats);
  getMaterialStats(token?: string): Observable<MaterialStatsResponse> {
    const headers = this.getHeaders(token);

    return this.http.get<MaterialStatsResponse>(`${this.apiUrl}/stats`, { headers }).pipe(
      catchError(error => {
        console.error('Error in getMaterialStats:', error);
        return throwError(() => error);
      })
    );
  }

  // ✅ SESUAI: router.get('/:id', auth, materiController.getMateriById);
  getMaterialById(materialId: string, token?: string): Observable<any> {
    const headers = this.getHeaders(token);

    return this.http.get(`${this.apiUrl}/${materialId}`, { headers }).pipe(
      catchError(error => {
        console.error('Error in getMaterialById:', error);
        return throwError(() => error);
      })
    );
  }

  updateMaterial(materialId: string, materialData: any, headerImage?: File, token?: string): Observable<any> {
  if (headerImage) {
    // ✅ Kirim sebagai FormData multipart untuk file upload
    const formData = this.createFormDataForMaterial(materialData, headerImage);
    const headers = this.getMultipartHeaders(token);
    
    return this.http.put(`${this.apiUrl}/${materialId}`, formData, { headers }).pipe(
      catchError(error => {
        console.error('Error in updateMaterial with file:', error);
        return throwError(() => error);
      })
    );
  } else {
    // ✅ Kirim sebagai JSON biasa jika tidak ada file
    const headers = this.getHeaders(token);
    return this.http.put(`${this.apiUrl}/${materialId}`, materialData, { headers }).pipe(
      catchError(error => {
        console.error('Error in updateMaterial:', error);
        return throwError(() => error);
      })
    );
  }
}

  // ✅ SESUAI: router.delete('/:id', auth, isGuru, materiController.deleteMateri);
  deleteMaterial(materialId: string, token: string): Observable<any> {
    const headers = this.getHeaders(token);

    return this.http.delete(`${this.apiUrl}/${materialId}`, { headers }).pipe(
      catchError(error => {
        console.error('Error in deleteMaterial:', error);
        return throwError(() => error);
      })
    );
  }

  deleteMaterialPermanent(materialId: string, token: string): Observable<any> {
    const headers = this.getHeaders(token);

    return this.http.delete(`${this.apiUrl}/${materialId}/permanent`, { headers }).pipe(
      catchError(error => {
        console.error('Error in deleteMaterialPermanent:', error);
        return throwError(() => error);
      })
    );
  }

  // ✅ SESUAI: router.get('/kelas/:classId', auth, materiController.getMateriByClass);
  getMaterialsByClass(classId: string, token?: string): Observable<any> {
    const headers = this.getHeaders(token);

    return this.http.get(`${this.apiUrl}/kelas/${classId}`, { headers }).pipe(
      catchError(error => {
        console.error('Error in getMaterialsByClass:', error);
        return throwError(() => error);
      })
    );
  }

  // ❌ TIDAK ADA DI ROUTER - Kemungkinan perlu endpoint terpisah untuk toggle status
  // Atau bisa menggunakan updateMaterial dengan field is_active saja
  toggleMaterialStatus(materialId: string, isActive: boolean, token: string): Observable<any> {
    const headers = this.getHeaders(token);
    const body = { is_active: isActive };

    // Menggunakan PUT untuk update field is_active saja
    return this.http.put(`${this.apiUrl}/${materialId}`, body, { headers }).pipe(
      catchError(error => {
        console.error('Error in toggleMaterialStatus:', error);
        return throwError(() => error);
      })
    );
  }

  // Helper method untuk mendapatkan nama kelas dari array ID
  getClassNamesByIds(classIds: string[], token?: string): Observable<{ [key: string]: string }> {
    if (!classIds || classIds.length === 0) {
      return new Observable(observer => {
        observer.next({});
        observer.complete();
      });
    }

    // Get school ID dari localStorage
    const schoolId = localStorage.getItem('schoolId');
    if (!schoolId) {
      return throwError(() => new Error('School ID not found'));
    }

    // Fetch all classes dari sekolah
    return this.classService.getClassesBySchool(schoolId, token).pipe(
      map(response => {
        const classMap: { [key: string]: string } = {};

        if (response.success && response.data) {
          response.data.forEach((kelas: any) => {
            if (classIds.includes(kelas._id)) {
              classMap[kelas._id] = kelas.nama_kelas;
            }
          });
        }

        return classMap;
      }),
      catchError(error => {
        console.error('Error getting class names:', error);
        return throwError(() => error);
      })
    );
  }
}