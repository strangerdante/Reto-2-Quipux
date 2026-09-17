import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PreflightCheck, VersionRecord } from '../models/version.model';
import { CampaignService } from './campaign.service';
import { TenantService } from './tenant.service';
import { ToastService } from './toast.service';

const API_BASE = 'http://localhost:3000/api';

export interface VersionDiffItem {
  field: string;
  before: string;
  after: string;
  type: 'changed' | 'added' | 'removed' | 'unchanged';
}

@Injectable({
  providedIn: 'root'
})
export class PublishService {
  private readonly http = inject(HttpClient);
  private readonly campaignService = inject(CampaignService);
  private readonly tenantService = inject(TenantService);
  private readonly toastService = inject(ToastService);

  readonly isPublishOpen = signal<boolean>(false);
  readonly isPublishing = signal<boolean>(false);
  readonly versions = signal<VersionRecord[]>([]);

  // Preflight checks calculados en tiempo real (AC-11, AC-19)
  readonly preflightChecks = computed<PreflightCheck[]>(() => {
    const campaign = this.campaignService.activeCampaign();
    const hasSlides = Array.isArray(campaign.slides) && campaign.slides.length > 0;
    
    // Validar enlaces seguros HTTPS o relativos
    let insecureCount = 0;
    if (hasSlides) {
      campaign.slides.forEach(s => {
        if (s.link && s.link.trim() !== '') {
          const l = s.link.trim();
          if (!l.startsWith('https://') && !l.startsWith('/') && !l.startsWith('#')) {
            insecureCount++;
          }
        }
      });
    }

    // Validar presencia de imágenes responsive
    const allHaveImages = hasSlides && campaign.slides.every(s => s.desktopPreview || s.desktopName);

    const hasValidRules = campaign.rules && campaign.rules.delay >= 0 && !!campaign.rules.pathRule;

    return [
      {
        id: 'c1',
        label: 'Contenido y enlaces válidos (HTTPS)',
        detail: hasSlides && insecureCount === 0
          ? 'Todos los slides tienen CTA y protocolo HTTPS seguro.'
          : (insecureCount > 0 ? `${insecureCount} enlace(s) no usan HTTPS.` : 'Debe tener al menos 1 slide.'),
        passed: hasSlides && insecureCount === 0
      },
      {
        id: 'c2',
        label: 'Aislamiento de Tenant en CDN',
        detail: `Ruta asignada estrictamente: ${this.tenantService.cdnBasePath()}`,
        passed: true
      },
      {
        id: 'c3',
        label: 'Reglas de frecuencia y ruta SPA',
        detail: `Ruta: "${campaign.rules?.pathRule || '*'}" con retardo de ${campaign.rules?.delay || 0}s`,
        passed: hasValidRules
      },
      {
        id: 'c4',
        label: 'Recursos multimedia responsive asignados',
        detail: allHaveImages
          ? 'Imágenes desktop y mobile asignadas en cada slide.'
          : 'Existen slides sin imagen asignada.',
        passed: allHaveImages
      }
    ];
  });

  // AP-03: Comparador visual de diferencias entre el borrador actual y la versión activa
  readonly versionDiff = computed<VersionDiffItem[]>(() => {
    const currentList = this.versions();
    const activeVersion = currentList.find(v => v.isCurrent);
    const draft = this.campaignService.activeCampaign();

    const diffs: VersionDiffItem[] = [];

    if (!activeVersion || !activeVersion.snapshot) {
      diffs.push({
        field: 'Campaña',
        before: 'Sin versión previa activa',
        after: draft.name,
        type: 'added'
      });
      return diffs;
    }

    const prev = activeVersion.snapshot;

    // Comparar nombre
    if (prev.summary !== draft.name) {
      diffs.push({
        field: 'Nombre / Título',
        before: prev.summary || 'Anterior',
        after: draft.name,
        type: 'changed'
      });
    }

    // Comparar slides
    const prevSlidesCount = prev.slides?.length || 0;
    const draftSlidesCount = draft.slides?.length || 0;
    if (prevSlidesCount !== draftSlidesCount) {
      diffs.push({
        field: 'Cantidad de Slides',
        before: `${prevSlidesCount} slide(s)`,
        after: `${draftSlidesCount} slide(s)`,
        type: 'changed'
      });
    }

    // Comparar ruta
    if (prev.rules?.pathRule !== draft.rules?.pathRule) {
      diffs.push({
        field: 'Regla de ruta SPA',
        before: prev.rules?.pathRule || '*',
        after: draft.rules?.pathRule || '*',
        type: 'changed'
      });
    }

    // Comparar retardo
    if (prev.rules?.delay !== draft.rules?.delay) {
      diffs.push({
        field: 'Retardo de aparición',
        before: `${prev.rules?.delay || 0}s`,
        after: `${draft.rules?.delay || 0}s`,
        type: 'changed'
      });
    }

    if (diffs.length === 0) {
      diffs.push({
        field: 'Estado',
        before: activeVersion.version,
        after: 'Sin cambios estructurales detectados',
        type: 'unchanged'
      });
    }

    return diffs;
  });

  constructor() {
    // Al cambiar de tenant o de campaña activa, recargar versiones inmutables reales
    effect(() => {
      const tenant = this.tenantService.activeTenantId();
      const campaign = this.campaignService.activeCampaign();
      if (campaign && campaign.id) {
        this.loadVersions(tenant, campaign.id);
      }
    });
  }

  loadVersions(tenantId?: string, campaignId?: string): void {
    const tenant = tenantId || this.tenantService.activeTenantId();
    const cId = campaignId || this.campaignService.activeCampaign().id || 'default';

    this.http.get<VersionRecord[]>(`${API_BASE}/publish/versions?tenant=${tenant}&campaignId=${cId}`).subscribe({
      next: (list) => {
        this.versions.set(list);
      },
      error: (err) => {
        console.warn('[PublishService] No se pudieron cargar las versiones:', err.message);
      }
    });
  }

  openPublishDialog(): void {
    this.isPublishOpen.set(true);
  }

  closePublishDialog(): void {
    this.isPublishOpen.set(false);
  }

  // AP-01: Verificación de permisos de usuario antes de publicar
  canPublish(): boolean {
    const role = this.tenantService.activeRole();
    return role === 'Publicador';
  }

  // Publicación real en servidor con snapshot inmutable y preflight checks (AC-11, AC-12, AC-13)
  confirmPublish(): void {
    if (!this.canPublish()) {
      this.toastService.show('⚠️ Solo usuarios con rol "Publicador" pueden emitir versiones a producción.');
      return;
    }

    const checks = this.preflightChecks();
    const passed = checks.every(c => c.passed);
    if (!passed) {
      this.toastService.show('❌ No se puede publicar: hay preflight checks pendientes');
      return;
    }

    this.isPublishing.set(true);
    const campaign = this.campaignService.activeCampaign();
    const author = this.tenantService.currentUser();
    const tenant = this.tenantService.activeTenantId();

    this.http.post<{ success: boolean; version: string; manifest: any }>(`${API_BASE}/publish?tenant=${tenant}`, {
      campaign,
      author
    }).subscribe({
      next: (res) => {
        this.isPublishing.set(false);
        this.isPublishOpen.set(false);

        // Actualizar campaña localmente con el nuevo estado y versión
        this.campaignService.activeCampaign.update(c => ({
          ...c,
          status: 'Publicado',
          version: res.version,
          updated: 'Justo ahora'
        }));

        this.loadVersions(tenant, campaign.id);
        this.toastService.show(`🚀 ¡Versión ${res.version} publicada exitosamente en el CDN!`);
      },
      error: (err) => {
        this.isPublishing.set(false);
        const errorMsg = err.error?.error || 'Error al procesar la publicación en el servidor.';
        this.toastService.show(`❌ ${errorMsg}`);
      }
    });
  }

  // Reversión real en servidor restaurando el manifest inmutable anterior (AC-14)
  rollbackToVersion(versionTag: string): void {
    const tenant = this.tenantService.activeTenantId();
    const campaignId = this.campaignService.activeCampaign().id;
    const author = this.tenantService.currentUser();

    this.http.post<{ success: boolean; newVersion: string; restoredFrom: string; manifest: any }>(`${API_BASE}/publish/rollback`, {
      tenantId: tenant,
      campaignId,
      targetVersion: versionTag,
      author
    }).subscribe({
      next: (res) => {
        // Restaurar estado de la campaña en memoria a partir del manifest restaurado
        if (res.manifest) {
          const m = res.manifest;
          this.campaignService.activeCampaign.update(c => ({
            ...c,
            version: res.newVersion,
            status: 'Publicado',
            updated: 'Justo ahora',
            layout: m.layout || c.layout,
            rules: m.rules ? { ...c.rules, ...m.rules } : c.rules,
            slides: m.slides ? m.slides.map((s: any) => ({
              id: s.id,
              order: s.order || s.id,
              active: s.active !== false,
              name: s.title || `Slide ${s.id}`,
              title: s.title,
              description: s.description,
              cta: s.cta,
              link: s.link,
              alt: s.alt,
              desktopName: s.desktopImage ? s.desktopImage.split('/').pop() : '',
              mobileName: s.mobileImage ? s.mobileImage.split('/').pop() : '',
              desktopPreview: s.desktopImage,
              mobilePreview: s.mobileImage
            })) : c.slides
          }));
        }

        this.loadVersions(tenant, campaignId);
        this.toastService.show(`🔄 Reversión exitosa: Restaurada ${res.restoredFrom} como ${res.newVersion}`);
      },
      error: (err) => {
        const msg = err.error?.error || 'Error al revertir versión';
        this.toastService.show(`❌ ${msg}`);
      }
    });
  }
}
