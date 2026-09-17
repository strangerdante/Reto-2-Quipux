import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ResourceAsset, ResourceFolder } from '../models/resource.model';
import { CampaignService } from './campaign.service';
import { TenantService } from './tenant.service';
import { ToastService } from './toast.service';

const API_BASE = 'http://localhost:3000/api';

export interface UploadResponse {
  valid: boolean;
  name: string;
  filename: string;
  url: string;
  cdnPath: string;
  sizeBytes: number;
  sizeKb: string;
  dimensions: string;
  status: 'Verificado' | 'Pendiente' | 'Inseguro';
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ResourceService {
  private readonly http = inject(HttpClient);
  private readonly tenantService = inject(TenantService);
  private readonly campaignService = inject(CampaignService);
  private readonly toastService = inject(ToastService);

  readonly folders = signal<ResourceFolder[]>([]);
  readonly assets = signal<ResourceAsset[]>([]);
  readonly isUploading = signal<boolean>(false);
  readonly uploadError = signal<string | null>(null);

  readonly rootPath = computed(() => {
    const tenantId = this.tenantService.activeTenantId();
    return `http://localhost:3000/resources/tenants/${tenantId}`;
  });

  readonly totalStorageFormatted = computed(() => {
    const all = this.assets();
    if (all.length === 0) return '0 KB';
    // Sumar KBs
    let totalKb = 0;
    all.forEach(a => {
      const match = a.size.match(/([\d.]+)\s*KB/i);
      if (match) {
        totalKb += parseFloat(match[1]);
      }
    });
    if (totalKb > 1024) {
      return `${(totalKb / 1024).toFixed(1)} MB`;
    }
    return `${totalKb.toFixed(1)} KB`;
  });

  constructor() {
    // Al cambiar de tenant, recargar automáticamente los recursos reales de ese tenant (AC-02, AC-05)
    effect(() => {
      const tenant = this.tenantService.activeTenantId();
      this.loadResources(tenant);
    });
  }

  loadResources(tenantId?: string): void {
    const tenant = tenantId || this.tenantService.activeTenantId();
    this.http.get<{ folders: ResourceFolder[]; assets: ResourceAsset[] }>(`${API_BASE}/resources?tenant=${tenant}`).subscribe({
      next: (res) => {
        this.folders.set(res.folders || []);
        this.assets.set(res.assets || []);
      },
      error: (err) => {
        console.warn('[ResourceService] No se pudieron cargar los recursos del tenant:', err.message);
      }
    });
  }

  // Carga real de imágenes con validación física (AC-05, AC-06, AC-20)
  uploadImage(file: File, target: 'desktop' | 'mobile'): void {
    this.uploadError.set(null);

    // Validación preliminar del lado del cliente
    const MAX_SIZE = 500 * 1024;
    const ALLOWED = ['image/webp', 'image/png', 'image/jpeg'];

    if (!ALLOWED.includes(file.type)) {
      const msg = `Formato "${file.type}" no permitido. Formatos autorizados: WebP, PNG y JPG.`;
      this.uploadError.set(msg);
      this.toastService.show(msg);
      return;
    }

    if (file.size > MAX_SIZE) {
      const sizeKb = (file.size / 1024).toFixed(1);
      const msg = `El archivo pesa ${sizeKb} KB. El límite máximo permitido es 500 KB.`;
      this.uploadError.set(msg);
      this.toastService.show(msg);
      return;
    }

    this.isUploading.set(true);
    const tenant = this.tenantService.activeTenantId();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tenant', tenant);
    formData.append('targetType', target);

    this.http.post<UploadResponse>(`${API_BASE}/upload`, formData).subscribe({
      next: (res) => {
        this.isUploading.set(false);
        if (target === 'desktop') {
          this.campaignService.updateSelectedSlide({
            desktopName: res.filename,
            desktopPreview: res.url
          });
        } else {
          this.campaignService.updateSelectedSlide({
            mobileName: res.filename,
            mobilePreview: res.url
          });
        }

        // Refrescar lista de recursos en el CDN
        this.loadResources(tenant);
        this.toastService.show(`✅ Imagen ${target} cargada al CDN: ${res.filename}`);
      },
      error: (err) => {
        this.isUploading.set(false);
        const serverError = err.error?.errors?.join(', ') || err.error?.error || 'Error al procesar el archivo en el servidor.';
        this.uploadError.set(serverError);
        this.toastService.show(`❌ ${serverError}`);
      }
    });
  }

  // Compatibilidad con la firma previa para slide-form
  simulateImageUpload(file: File, target: 'desktop' | 'mobile'): void {
    this.uploadImage(file, target);
  }
}
