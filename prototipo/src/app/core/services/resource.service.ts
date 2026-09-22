import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ResourceAsset, ResourceFolder } from '../models/resource.model';
import { CampaignService } from './campaign.service';
import { TenantService } from './tenant.service';
import { APP_CONFIG } from '../config/app-config';
import { ToastService } from './toast.service';

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
  private readonly config = inject(APP_CONFIG);
  private readonly tenantService = inject(TenantService);
  private readonly campaignService = inject(CampaignService);
  private readonly toastService = inject(ToastService);

  readonly folders = signal<ResourceFolder[]>([]);
  readonly assets = signal<ResourceAsset[]>([]);
  readonly isUploading = signal<boolean>(false);
  readonly uploadError = signal<string | null>(null);

  readonly rootPath = computed(() => {
    const tenantId = this.tenantService.activeTenantId();
    return `${this.config.cdnBaseUrl}/resources/tenants/${tenantId}`;
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
    this.http.get<{ folders: ResourceFolder[]; assets: ResourceAsset[] }>(`${this.config.apiBaseUrl}/resources?tenant=${tenant}`).subscribe({
      next: (res) => {
        this.folders.set(res.folders || []);
        this.assets.set(res.assets || []);
      },
      error: (err) => {
        console.warn('[ResourceService] No se pudieron cargar los recursos del tenant:', err.message);
      }
    });
  }

  // Auto-optimización y compresión ligera por Canvas antes de enviar al servidor (AC-20)
  private async optimizeImageIfNeeded(file: File, target: 'desktop' | 'mobile'): Promise<File> {
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof Image === 'undefined') {
      return file;
    }

    const lowerType = file.type.toLowerCase();
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(lowerType)) {
      return file;
    }

    return new Promise((resolve) => {
      const img = new Image();
      let objectUrl = '';
      try {
        objectUrl = URL.createObjectURL(file);
      } catch {
        resolve(file);
        return;
      }

      img.onload = () => {
        try {
          URL.revokeObjectURL(objectUrl);
          const originalWidth = img.naturalWidth || img.width;
          const originalHeight = img.naturalHeight || img.height;

          // Dimensiones máximas recomendadas (DPR 2x): Desktop 1600x1120, Mobile 840x840
          const maxW = target === 'desktop' ? 1600 : 840;
          const maxH = target === 'desktop' ? 1120 : 840;

          // Si el archivo ya es ligero (<= 300 KB) y no excede dimensiones, no alterarlo
          if (file.size <= 300 * 1024 && originalWidth <= maxW && originalHeight <= maxH) {
            resolve(file);
            return;
          }

          let targetWidth = originalWidth;
          let targetHeight = originalHeight;
          if (targetWidth > maxW || targetHeight > maxH) {
            const ratio = Math.min(maxW / targetWidth, maxH / targetHeight);
            targetWidth = Math.max(1, Math.round(targetWidth * ratio));
            targetHeight = Math.max(1, Math.round(targetHeight * ratio));
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx || !canvas.toBlob) {
            resolve(file);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          canvas.toBlob((blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const optimizedFile = new File([blob], `${baseName}.webp`, { type: 'image/webp' });
            resolve(optimizedFile);
          }, 'image/webp', 0.85);
        } catch {
          resolve(file);
        }
      };

      img.onerror = () => {
        try { URL.revokeObjectURL(objectUrl); } catch { /* ignore */ }
        resolve(file);
      };

      img.src = objectUrl;
    });
  }

  // Carga real de imágenes con validación física y optimización (AC-05, AC-06, AC-20)
  async uploadImage(file: File, target: 'desktop' | 'mobile'): Promise<void> {
    this.uploadError.set(null);

    // Validación preliminar del lado del cliente - Límite realista de 2 MB para popup
    const MAX_SIZE = 2 * 1024 * 1024;
    const ALLOWED = ['image/webp', 'image/png', 'image/jpeg', 'image/jpg'];

    const lowerType = (file.type || '').toLowerCase();
    if (!ALLOWED.includes(lowerType)) {
      const msg = `Formato "${file.type || 'desconocido'}" no permitido. Formatos autorizados: WebP, PNG y JPG.`;
      this.uploadError.set(msg);
      this.toastService.show(msg);
      return;
    }

    if (file.size > MAX_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      const msg = `El archivo pesa ${sizeMb} MB. El límite máximo para popups web es 2.0 MB.`;
      this.uploadError.set(msg);
      this.toastService.show(msg);
      return;
    }

    this.isUploading.set(true);

    // Optimización transparente del lado del cliente si la imagen es pesada o excede dimensiones
    let processedFile: File;
    try {
      processedFile = await this.optimizeImageIfNeeded(file, target);
    } catch {
      processedFile = file;
    }

    const tenant = this.tenantService.activeTenantId();
    const formData = new FormData();
    formData.append('file', processedFile);
    formData.append('tenant', tenant);
    formData.append('targetType', target);

    this.http.post<UploadResponse>(`${this.config.apiBaseUrl}/upload`, formData).subscribe({
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
        this.toastService.show(`✅ Imagen ${target} optimizada y cargada al CDN (${res.sizeKb}): ${res.filename}`);
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
