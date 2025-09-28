import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ClassService } from 'src/app/service/class.service';
import { MaterialService, CopyMaterialResponse } from 'src/app/service/material.service';

interface KelasOption {
  id: string;
  nama: string;
}

interface MaterialData {
  _id: string;
  judul: string;
  deskripsi_singkat?: string;
  kategori?: string;
}

@Component({
  selector: 'app-modal-connect-class-to-material',
  templateUrl: './modal-connect-class-to-material.component.html',
  styleUrls: ['./modal-connect-class-to-material.component.css']
})
export class ModalConnectClassToMaterialComponent implements OnInit {

  // Input data dari parent component
  materialData: MaterialData | null = null;
  
  // Class selection
  kelasList: KelasOption[] = [];
  selectedKelas: string[] = [];
  
  // State management
  isLoadingClasses: boolean = false;
  isCopying: boolean = false;
  errorMsg: string = '';
  showValidationError: boolean = false;
  
  // User data
  token: string = '';
  schoolId: string = '';

  // Callback functions
  onSuccess: ((response: CopyMaterialResponse) => void) | undefined;
  onError: ((error: any) => void) | undefined;

  constructor(
    public bsModalRef: BsModalRef,
    private classService: ClassService,
    private materialService: MaterialService
  ) { }

  ngOnInit(): void {
    this.loadUserData();
    this.loadClasses();
  }

  loadUserData(): void {
    this.token = localStorage.getItem('token') || '';
    this.schoolId = localStorage.getItem('schoolId') || '';

    if (!this.token || !this.schoolId) {
      this.errorMsg = 'Data login tidak ditemukan. Silakan login ulang.';
    }
  }

  loadClasses(): void {
    if (!this.token || !this.schoolId) {
      this.errorMsg = 'Data login tidak valid';
      return;
    }

    this.isLoadingClasses = true;
    this.errorMsg = '';

    // Try multiple methods to get active classes, same as create-materials
    this.classService.getActiveClassesBySchool(this.schoolId, this.token)
      .subscribe({
        next: (response) => {
          this.handleClassesResponse(response);
        },
        error: (error) => {
          console.error('getActiveClassesBySchool failed:', error);

          // Fallback to getClassesBySchool
          this.classService.getClassesBySchool(this.schoolId, this.token)
            .subscribe({
              next: (response) => {
                this.handleClassesResponse(response);
              },
              error: (fallbackError) => {
                console.error('Fallback getClassesBySchool also failed:', fallbackError);

                // Final fallback to getClassesBySchoolWithStatus
                this.classService.getClassesBySchoolWithStatus(this.schoolId, 1, this.token)
                  .subscribe({
                    next: (response) => {
                      this.handleClassesResponse(response);
                    },
                    error: (finalError) => {
                      console.error('All methods failed:', finalError);
                      this.handleClassesError(finalError);
                    }
                  });
              }
            });
        }
      });
  }

  private handleClassesResponse(response: any): void {
    this.isLoadingClasses = false;

    if (response && response.success && response.data) {
      this.kelasList = response.data
        .filter((kelas: any) => kelas.flag_aktif === 1)
        .map((kelas: any) => ({
          id: kelas._id,
          nama: kelas.nama_kelas
        }));

      if (this.kelasList.length === 0) {
        this.errorMsg = 'Tidak ada kelas aktif ditemukan.';
      } else {
        this.errorMsg = '';
      }
    } else {
      console.warn('Invalid response structure:', response);
      this.kelasList = [];
      this.errorMsg = 'Format response tidak valid.';
    }
  }

  private handleClassesError(error: any): void {
    console.error('Classes loading error:', error);
    this.isLoadingClasses = false;
    this.kelasList = [];

    if (error.status === 401) {
      this.errorMsg = 'Session expired. Silakan login ulang.';
    } else if (error.status === 403) {
      this.errorMsg = 'Tidak memiliki akses untuk melihat data kelas.';
    } else if (error.status === 404) {
      this.errorMsg = 'Endpoint tidak ditemukan. Periksa URL API.';
    } else {
      this.errorMsg = `Gagal memuat data kelas: ${error.message || 'Unknown error'}`;
    }
  }

  onKelasChange(event: Event, kelasId: string): void {
    const input = event.target as HTMLInputElement;
    const checked = input.checked;

    if (checked) {
      if (!this.selectedKelas.includes(kelasId)) {
        this.selectedKelas.push(kelasId);
      }
    } else {
      const index = this.selectedKelas.indexOf(kelasId);
      if (index > -1) {
        this.selectedKelas.splice(index, 1);
      }
    }

    // Reset validation error when user makes selection
    if (this.selectedKelas.length > 0) {
      this.showValidationError = false;
    }
  }

  getSelectedKelasNames(): string[] {
    return this.kelasList
      .filter(kelas => this.selectedKelas.includes(kelas.id))
      .map(kelas => kelas.nama);
  }

  copyMaterial(): void {
    if (this.selectedKelas.length === 0) {
      this.showValidationError = true;
      return;
    }

    if (!this.materialData?._id) {
      this.errorMsg = 'Data materi tidak valid';
      return;
    }

    this.isCopying = true;
    this.errorMsg = '';
    this.showValidationError = false;

    console.log('📋 Copying material with classes:', {
      materialId: this.materialData._id,
      selectedClasses: this.selectedKelas,
      classNames: this.getSelectedKelasNames()
    });

    this.materialService.copyPublicMaterial(this.materialData._id, this.selectedKelas, this.token)
      .subscribe({
        next: (response: CopyMaterialResponse) => {
          console.log('✅ Material copied successfully:', response);
          this.isCopying = false;
          
          // Call success callback if provided
          if (this.onSuccess) {
            this.onSuccess(response);
          }
          
          // Close modal
          this.bsModalRef.hide();
        },
        error: (error) => {
          console.error('❌ Error copying material:', error);
          this.isCopying = false;
          
          let errorMessage = `Gagal menyalin materi "${this.materialData?.judul}". Silakan coba lagi.`;
          
          if (error.status === 409) {
            errorMessage = 'Materi ini sudah pernah disalin sebelumnya ke sekolah Anda.';
          } else if (error.status === 403) {
            errorMessage = 'Anda tidak memiliki akses untuk menyalin materi ini.';
          } else if (error.status === 404) {
            errorMessage = 'Materi tidak ditemukan atau sudah tidak tersedia.';
          } else if (error.status === 400) {
            errorMessage = 'Data materi tidak valid atau sudah tidak aktif.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          this.errorMsg = errorMessage;
          
          // Call error callback if provided
          if (this.onError) {
            this.onError(error);
          }
        }
      });
  }

  cancelAction(): void {
    this.bsModalRef.hide();
  }
}
