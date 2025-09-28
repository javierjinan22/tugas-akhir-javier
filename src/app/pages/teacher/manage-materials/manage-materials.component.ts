import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { MaterialService, Material, MaterialsResponse } from 'src/app/service/material.service';
import { ModalConfirmationDeleteMaterialsComponent } from './modal-confirmation-delete-materials/modal-confirmation-delete-materials.component';

interface ProcessedMaterial {
  _id: string;
  judul: string;
  kelas: string[];
  deskripsi_singkat: string;
  is_active: boolean;
  created_at: string;
  soal_count: number;
  flag_unduh: boolean;
}

@Component({
  selector: 'app-manage-materials',
  templateUrl: './manage-materials.component.html',
  styleUrls: ['./manage-materials.component.css']
})
export class ManageMaterialsComponent implements OnInit {

  @ViewChild('searchInput') searchInputRef!: ElementRef;

  // Data arrays
  materials: Material[] = [];
  processedMaterials: ProcessedMaterial[] = [];
  filteredMateri: ProcessedMaterial[] = [];

  keyword: string = '';
  loading: boolean = false;
  errorMsg: string = '';
  token: string = '';
  deletingMaterial: { [key: string]: boolean } = {};
  togglingMaterial: { [key: string]: boolean } = {};

  showToast = false;
  toastMessage = '';
  toastClass = '';
  toastIcon = '';
  private toastTimeout?: number;

  bsModalRef?: BsModalRef;

  constructor(
    private router: Router,
    private materialService: MaterialService,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    this.token = localStorage.getItem('token') || '';

    if (this.token) {
      this.getMaterials();
    } else {
      this.errorMsg = 'Token tidak ditemukan. Silakan login ulang.';
    }
  }

  getMaterials() {
    this.loading = true;
    this.errorMsg = '';

    this.materialService.getMyMaterials(this.token).subscribe({
      next: (response: MaterialsResponse) => {

        if (response.success && response.data && Array.isArray(response.data)) {
          this.materials = response.data;
          this.processMaterialsWithClassNames();
        } else {
          this.materials = [];
          this.processedMaterials = [];
          this.filteredMateri = [];
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error fetching materials:', err);
        this.errorMsg = 'Gagal memuat data materi. Silakan coba lagi.';
        this.materials = [];
        this.processedMaterials = [];
        this.filteredMateri = [];
        this.loading = false;
      }
    });
  }

  // Process materials dan ambil nama kelas
  processMaterialsWithClassNames() {
    if (!this.materials || this.materials.length === 0) {
      this.processedMaterials = [];
      this.filteredMateri = [];
      return;
    }

    // Kumpulkan semua unique class IDs
    const allClassIds = new Set<string>();
    this.materials.forEach(material => {
      if (material.kelas_ditautkan && Array.isArray(material.kelas_ditautkan)) {
        material.kelas_ditautkan.forEach(classId => allClassIds.add(classId));
      }
    });

    const uniqueClassIds = Array.from(allClassIds);

    if (uniqueClassIds.length === 0) {
      // Jika tidak ada kelas yang ditautkan
      this.processedMaterials = this.materials.map(material => this.mapMaterialToProcessed(material, {}));
      this.filteredMateri = [...this.processedMaterials];
      return;
    }

    // Ambil nama kelas dari service
    this.materialService.getClassNamesByIds(uniqueClassIds, this.token).subscribe({
      next: (classMap: { [key: string]: string }) => {

        this.processedMaterials = this.materials.map(material =>
          this.mapMaterialToProcessed(material, classMap)
        );
        this.filteredMateri = [...this.processedMaterials];
      },
      error: (error) => {
        console.error('❌ Error getting class names:', error);

        // Fallback: gunakan ID kelas jika gagal ambil nama
        this.processedMaterials = this.materials.map(material =>
          this.mapMaterialToProcessed(material, {})
        );
        this.filteredMateri = [...this.processedMaterials];
      }
    });
  }

  // Helper method untuk mapping material ke format yang dibutuhkan component
  private mapMaterialToProcessed(material: Material, classMap: { [key: string]: string }): ProcessedMaterial {
    const kelasNames = material.kelas_ditautkan?.map(classId =>
      classMap[classId] || `Kelas ID: ${classId}`
    ) || [];

    return {
      _id: material._id,
      judul: material.judul_materi,
      kelas: kelasNames,
      deskripsi_singkat: material.deskripsi_singkat,
      is_active: material.is_active,
      created_at: material.created_at,
      soal_count: material.soal?.length || 0,
      flag_unduh: material.flag_unduh
    };
  }

  onSearch() {

    if (!this.keyword.trim()) {
      // ✅ MENAMPILKAN SEMUA MATERI TERLEPAS DARI STATUS
      this.filteredMateri = [...this.processedMaterials];
      return;
    }

    const searchTerm = this.keyword.toLowerCase();

    // ✅ FILTER HANYA BERDASARKAN JUDUL DAN KELAS, BUKAN STATUS
    this.filteredMateri = this.processedMaterials.filter(materi =>
      materi.judul.toLowerCase().includes(searchTerm) ||
      materi.kelas.some(k => k.toLowerCase().includes(searchTerm))
    );
  }

  onTambah() {
    this.router.navigate(['/guru/kelola-materi/tambah-materi']);
  }

  lihatMateri(materi: ProcessedMaterial) {
    this.router.navigate(['/guru/kelola-materi/detail-materi', materi._id]);
  }

  editMateri(materi: ProcessedMaterial) {
    this.router.navigate(['/guru/kelola-materi/edit-materi', materi._id]);
  }

  hapusMateri(materi: ProcessedMaterial) {

    const initialState = {
      materialData: {
        judul: materi.judul,
        _id: materi._id
      }
    };

    this.bsModalRef = this.modalService.show(ModalConfirmationDeleteMaterialsComponent, {
      initialState,
      class: 'modal-dialog-centered',
      backdrop: 'static',
      keyboard: false
    });

    this.bsModalRef.content.onClose.subscribe((result: { action: string }) => {

      if (result.action === 'delete') {
        this.performMaterialDeletion(materi);
      }
    });
  }

  private performMaterialDeletion(materi: ProcessedMaterial) {
    this.deletingMaterial[materi._id] = true;
    this.materialService.deleteMaterialPermanent(materi._id, this.token).subscribe({
      next: (response) => {
        // Remove dari arrays
        this.processedMaterials = this.processedMaterials.filter(m => m._id !== materi._id);
        this.filteredMateri = this.filteredMateri.filter(m => m._id !== materi._id);
        this.materials = this.materials.filter(m => m._id !== materi._id);
        this.deletingMaterial[materi._id] = false;

        // ✅ Toast sukses
        this.showSuccessToast(`Materi "${materi.judul}" berhasil dihapus.`);
      },
      error: (error) => {
        console.error('❌ Error deleting material:', error);
        let errorMessage = `Gagal menghapus materi "${materi.judul}". Silakan coba lagi.`;
        if (error.status === 403) {
          errorMessage = 'Anda tidak memiliki akses untuk menghapus materi ini.';
        } else if (error.status === 404) {
          errorMessage = 'Materi tidak ditemukan.';
        }
        this.showErrorToast(errorMessage);
        this.deletingMaterial[materi._id] = false;
      }
    });
  }

  toggleMaterialStatus(materi: ProcessedMaterial, event: Event) {
    event.stopPropagation();

    const newStatus = !materi.is_active;
    const statusText = newStatus ? 'mengaktifkan' : 'menonaktifkan';

    this.togglingMaterial[materi._id] = true;

    this.materialService.toggleMaterialStatus(materi._id, newStatus, this.token).subscribe({
      next: (response) => {
        // Update status di arrays
        const materialIndex = this.processedMaterials.findIndex(m => m._id === materi._id);
        if (materialIndex !== -1) {
          this.processedMaterials[materialIndex].is_active = newStatus;
        }
        const filteredIndex = this.filteredMateri.findIndex(m => m._id === materi._id);
        if (filteredIndex !== -1) {
          this.filteredMateri[filteredIndex].is_active = newStatus;
        }
        const originalIndex = this.materials.findIndex(m => m._id === materi._id);
        if (originalIndex !== -1) {
          this.materials[originalIndex].is_active = newStatus;
        }
        this.togglingMaterial[materi._id] = false;

        // ✅ Toast sukses
        if (newStatus) {
          this.showSuccessToast(`Materi "${materi.judul}" berhasil diaktifkan.`);
        } else {
          this.showSuccessToast(`Materi "${materi.judul}" berhasil dinonaktifkan.`);
        }
      },
      error: (error) => {
        console.error('❌ Error toggling material status:', error);
        let errorMessage = `Gagal ${statusText} materi "${materi.judul}". Silakan coba lagi.`;
        if (error.status === 403) {
          errorMessage = 'Anda tidak memiliki akses untuk mengubah status materi ini.';
        } else if (error.status === 404) {
          errorMessage = 'Materi tidak ditemukan.';
        }
        this.showErrorToast(errorMessage);
        this.togglingMaterial[materi._id] = false;
      }
    });
  }
  // Helper methods
  isDeleting(materialId: string): boolean {
    return this.deletingMaterial[materialId] || false;
  }

  isToggling(materialId: string): boolean {
    return this.togglingMaterial[materialId] || false;
  }

  getTotalMaterialsCount(): number {
    return this.processedMaterials?.length || 0;
  }

  getFilteredMaterialsCount(): number {
    return this.filteredMateri?.length || 0;
  }

  getActiveMaterialsCount(): number {
    return this.filteredMateri?.filter(m => m.is_active)?.length || 0;
  }

  getInactiveMaterialsCount(): number {
    return this.filteredMateri?.filter(m => !m.is_active)?.length || 0;
  }

  refreshMaterials(): void {
    this.getMaterials();
  }

  // Untuk trigger search saat icon diklik
  onSearchIconClick() {
    this.searchInputRef.nativeElement.focus();
  }

  onBankMaterialsClicked() {
    this.router.navigate(['/guru/bank-materi']);
  }

  showSuccessToast(message: string): void {
    this.hideToast();
    setTimeout(() => {
      this.toastMessage = message;
      this.toastClass = 'toast-success';
      this.toastIcon = 'fas fa-check-circle';
      this.showToast = true;
      this.toastTimeout = window.setTimeout(() => this.hideToast(), 3000);
    }, 100);
  }

  showErrorToast(message: string): void {
    this.hideToast();
    setTimeout(() => {
      this.toastMessage = message;
      this.toastClass = 'toast-error';
      this.toastIcon = 'fas fa-exclamation-circle';
      this.showToast = true;
      this.toastTimeout = window.setTimeout(() => this.hideToast(), 4000);
    }, 100);
  }

  hideToast(): void {
    this.showToast = false;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  ngOnDestroy(): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }
}
