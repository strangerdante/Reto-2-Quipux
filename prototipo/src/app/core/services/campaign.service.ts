import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Campaign, CampaignType, PopupLayout, PopupRules, Slide } from '../models/campaign.model';
import { APP_CONFIG } from '../config/app-config';
import { TenantService } from './tenant.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class CampaignService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly tenantService = inject(TenantService);
  private readonly toastService = inject(ToastService);

  private readonly defaultCampaign: Campaign = {
    id: 'camp-default',
    name: 'Campaña Valle del Cauca',
    type: 'Modal con slider',
    tenant: 'valle',
    status: 'Borrador',
    version: 'v1',
    updated: 'Reciente',
    layout: 'side',
    slides: [
      {
        id: 1,
        name: 'Slide 1 - Inicio',
        title: 'Impuesto Vehicular 2026',
        description: 'Paga con 15% de descuento antes del 30 de abril.',
        cta: 'Liquidar ahora',
        link: 'https://impuestos.valledelcauca.gov.co',
        alt: 'Banner institucional Valle',
        desktopName: 'cobro-coactivo-desk.png',
        mobileName: 'cobro-coactivo-mob.png',
        desktopPreview: `${this.config.cdnBaseUrl}/resources/tenants/valle/assets/desktop/cobro-coactivo-desk.png`,
        mobilePreview: `${this.config.cdnBaseUrl}/resources/tenants/valle/assets/mobile/cobro-coactivo-mob.png`,
        order: 1,
        active: true
      }
    ],
    rules: {
      delay: 1,
      frequency: 'once_per_session',
      pathRule: '*',
      startDate: '',
      endDate: '',
      escToggle: true,
      autoplayToggle: true,
      dataLayerToggle: true
    }
  };

  // Lista global de campañas persistentes filtradas por el tenant activo
  readonly campaigns = signal<Campaign[]>([this.defaultCampaign]);
  readonly isLoading = signal<boolean>(false);

  // Filtro de búsqueda en tabla de dashboard
  readonly filterQuery = signal<string>('');

  readonly filteredCampaigns = computed(() => {
    const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const q = normalize(this.filterQuery().trim());
    const list = this.campaigns();
    if (!q) return list;
    return list.filter(c =>
      normalize(c.name).includes(q) ||
      normalize(c.tenant).includes(q) ||
      normalize(c.status).includes(q) ||
      normalize(c.type).includes(q)
    );
  });

  // Campaña activa en el Editor
  readonly activeCampaign = signal<Campaign>(this.defaultCampaign);

  // Estados del Editor
  readonly editorTab = signal<'content' | 'style' | 'rules' | 'publish'>('content');
  readonly selectedSlideId = signal<number>(1);
  readonly previewIndex = signal<number>(0);
  readonly previewMode = signal<'desktop' | 'mobile'>('desktop');
  readonly saveStatus = signal<string>('Borrador cargado');

  // Computed properties reactivas
  readonly selectedSlide = computed(() => {
    const slides = this.activeCampaign().slides;
    if (!slides || slides.length === 0) return null;
    return slides.find(s => s.id === this.selectedSlideId()) ?? slides[0];
  });

  readonly visibleSlide = computed(() => {
    const slides = this.activeCampaign().slides;
    if (!slides || slides.length === 0) return null;
    const idx = Math.min(this.previewIndex(), Math.max(0, slides.length - 1));
    return slides[idx] ?? this.selectedSlide();
  });

  readonly componentSlug = computed(() => {
    const name = this.activeCampaign().name;
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'nuevo-componente';
  });

  constructor() {
    // Reactividad multitenant estricta (AC-02): Al cambiar de tenant en el topbar,
    // se recargan automáticamente las campañas persistentes de ese tenant específico.
    effect(() => {
      const tenantId = this.tenantService.activeTenantId();
      this.loadCampaigns(tenantId);
    });
  }

  loadCampaigns(tenantId?: string): void {
    const tenant = tenantId || this.tenantService.activeTenantId();
    this.isLoading.set(true);

    this.http.get<Campaign[]>(`${this.config.apiBaseUrl}/campaigns?tenant=${tenant}`).subscribe({
      next: (list) => {
        this.campaigns.set(list);
        this.isLoading.set(false);

        // Si la campaña activa no pertenece al nuevo tenant, cargar la primera disponible
        const currentActive = this.activeCampaign();
        if (!list.some(c => c.id === currentActive.id)) {
          if (list.length > 0) {
            this.loadCampaign(list[0].id);
          }
        }
      },
      error: (err) => {
        console.warn('[CampaignService] Error conectando con API local, cargando estado seguro:', err.message);
        this.isLoading.set(false);
      }
    });
  }

  setFilterQuery(query: string): void {
    this.filterQuery.set(query);
  }

  loadCampaign(id: string): void {
    const found = this.campaigns().find(c => c.id === id);
    if (found) {
      this.activeCampaign.set(JSON.parse(JSON.stringify(found)));
      this.selectedSlideId.set(found.slides[0]?.id ?? 1);
      this.previewIndex.set(0);
      this.saveStatus.set('Borrador cargado');
    } else {
      // Intentar cargar por HTTP si no está en memoria
      const tenant = this.tenantService.activeTenantId();
      this.http.get<Campaign>(`${this.config.apiBaseUrl}/campaigns/${id}?tenant=${tenant}`).subscribe({
        next: (camp) => {
          this.activeCampaign.set(camp);
          this.selectedSlideId.set(camp.slides[0]?.id ?? 1);
          this.previewIndex.set(0);
          this.saveStatus.set('Borrador cargado');
        },
        error: () => {
          this.toastService.show('No se encontró la campaña especificada');
        }
      });
    }
  }

  updateCampaignName(name: string): void {
    this.activeCampaign.update(c => ({ ...c, name }));
    this.markDirty();
  }

  setEditorTab(tab: 'content' | 'style' | 'rules' | 'publish'): void {
    this.editorTab.set(tab);
  }

  selectSlide(id: number): void {
    this.selectedSlideId.set(id);
    const slides = this.activeCampaign().slides;
    const idx = slides.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.previewIndex.set(idx);
    }
  }

  setPreviewIndex(idx: number): void {
    this.previewIndex.set(idx);
    const slides = this.activeCampaign().slides;
    if (slides[idx]) {
      this.selectedSlideId.set(slides[idx].id);
    }
  }

  nextPreviewSlide(): void {
    const count = this.activeCampaign().slides.length;
    if (count <= 1) return;
    const nextIdx = (this.previewIndex() + 1) % count;
    this.setPreviewIndex(nextIdx);
  }

  prevPreviewSlide(): void {
    const count = this.activeCampaign().slides.length;
    if (count <= 1) return;
    const prevIdx = (this.previewIndex() - 1 + count) % count;
    this.setPreviewIndex(prevIdx);
  }

  setPreviewMode(mode: 'desktop' | 'mobile'): void {
    this.previewMode.set(mode);
  }

  setLayout(layout: PopupLayout): void {
    this.activeCampaign.update(c => ({ ...c, layout }));
    this.markDirty();
    this.toastService.show(`Disposición cambiada a: ${layout}`);
  }

  updateSelectedSlide(changes: Partial<Slide>): void {
    const currentId = this.selectedSlideId();
    this.activeCampaign.update(campaign => ({
      ...campaign,
      slides: campaign.slides.map(s => (s.id === currentId ? { ...s, ...changes } : s))
    }));
    this.markDirty();
  }

  addSlide(): void {
    const current = this.activeCampaign();
    const newId = current.slides.length > 0 ? Math.max(...current.slides.map(s => s.id)) + 1 : 1;
    const newIndex = current.slides.length + 1;
    const newSlide: Slide = {
      id: newId,
      order: newIndex,
      active: true,
      name: `Slide ${newIndex}`,
      title: `Nuevo Slide ${newIndex}`,
      description: 'Ingresa la descripción y llamado a la acción para esta diapositiva.',
      cta: 'Ver más',
      link: 'https://www.quipux.com',
      alt: `Imagen informativa slide ${newIndex}`,
      desktopName: `slide-${newId}-desktop.webp`,
      mobileName: `slide-${newId}-mobile.webp`,
      desktopPreview: null,
      mobilePreview: null
    };

    this.activeCampaign.update(c => ({
      ...c,
      slides: [...c.slides, newSlide]
    }));
    this.selectedSlideId.set(newId);
    this.previewIndex.set(this.activeCampaign().slides.length - 1);
    this.markDirty();
    this.toastService.show(`Slide ${newIndex} agregado`);
  }

  // AC-03: Duplicación de slides reactiva
  duplicateSlide(id: number): void {
    const current = this.activeCampaign();
    const source = current.slides.find(s => s.id === id);
    if (!source) return;

    const newId = Math.max(...current.slides.map(s => s.id)) + 1;
    const newSlide: Slide = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId,
      name: `${source.name} (Copia)`,
      title: `${source.title} (Copia)`
    };

    this.activeCampaign.update(c => ({
      ...c,
      slides: [...c.slides, newSlide]
    }));
    this.selectedSlideId.set(newId);
    this.previewIndex.set(this.activeCampaign().slides.length - 1);
    this.markDirty();
    this.toastService.show(`Slide duplicado como ID: ${newId}`);
  }

  // AC-03: Alternar visibilidad de slide (on/off)
  toggleSlideActive(id: number): void {
    this.activeCampaign.update(c => ({
      ...c,
      slides: c.slides.map(s => (s.id === id ? { ...s, active: !(s.active !== false) } : s))
    }));
    this.markDirty();
    const updated = this.activeCampaign().slides.find(s => s.id === id);
    this.toastService.show(`Slide ${updated?.name} ${updated?.active ? 'activado' : 'ocultado'}`);
  }

  // AC-03: Reordenamiento de slides (Subir / Bajar o Drag & Drop)
  reorderSlide(fromIndex: number, toIndex: number): void {
    const slides = [...this.activeCampaign().slides];
    if (fromIndex < 0 || fromIndex >= slides.length || toIndex < 0 || toIndex >= slides.length) return;

    const [moved] = slides.splice(fromIndex, 1);
    slides.splice(toIndex, 0, moved);

    // Actualizar propiedad order
    const reordered = slides.map((s, idx) => ({ ...s, order: idx + 1 }));

    this.activeCampaign.update(c => ({ ...c, slides: reordered }));
    this.previewIndex.set(toIndex);
    this.markDirty();
    this.toastService.show('Orden de slides actualizado');
  }

  deleteSlide(id: number): void {
    const current = this.activeCampaign();
    if (current.slides.length <= 1) {
      this.toastService.show('El modal debe contener al menos un slide');
      return;
    }

    const filtered = current.slides.filter(s => s.id !== id);
    this.activeCampaign.update(c => ({
      ...c,
      slides: filtered
    }));
    this.selectedSlideId.set(filtered[0].id);
    this.previewIndex.set(0);
    this.markDirty();
    this.toastService.show('Slide eliminado');
  }

  updateRules(rulesPartial: Partial<PopupRules>): void {
    this.activeCampaign.update(c => ({
      ...c,
      rules: { ...c.rules, ...rulesPartial }
    }));
    this.markDirty();
  }

  // Guardado real de borrador en el servidor (AC-10)
  saveDraft(): void {
    const current = this.activeCampaign();
    const tenant = this.tenantService.activeTenantId();
    current.tenant = tenant;

    this.saveStatus.set('Guardando...');

    this.http.post<{ success: boolean; campaign: Campaign }>(`${this.config.apiBaseUrl}/campaigns?tenant=${tenant}`, current).subscribe({
      next: (res) => {
        const saved = res.campaign || current;
        this.campaigns.update(list => {
          const index = list.findIndex(c => c.id === saved.id);
          if (index >= 0) {
            const copy = [...list];
            copy[index] = saved;
            return copy;
          }
          return [saved, ...list];
        });
        this.saveStatus.set('Guardado en servidor');
        this.toastService.show('Borrador guardado permanentemente en disco');
      },
      error: (err) => {
        console.error('Error guardando borrador:', err);
        this.saveStatus.set('Error al guardar');
        this.toastService.show('Error al persistir borrador');
      }
    });
  }

  canToggleStatus(): boolean {
    const role = this.tenantService.activeRole();
    return role === 'Publicador' || role === 'Revisor';
  }

  toggleCampaignStatus(campaignId: string, targetStatus: 'Inactivo' | 'Publicado', onSuccess?: () => void): void {
    if (!this.canToggleStatus()) {
      this.toastService.show('⚠️ Solo usuarios con rol "Publicador" o "Revisor" pueden cambiar el estado en vivo.');
      return;
    }

    const tenant = this.tenantService.activeTenantId();
    const author = this.tenantService.currentUser();
    const list = this.campaigns();
    const target = list.find(c => c.id === campaignId);

    const fallbackUpdated: Campaign = {
      ...(target || this.activeCampaign()),
      status: targetStatus,
      updated: targetStatus === 'Inactivo' ? 'Pausada en vivo' : 'Reactivada en vivo'
    };

    this.http.post<{ success: boolean; campaign: Campaign; status: 'Inactivo' | 'Publicado' }>(
      `${this.config.apiBaseUrl}/publish/toggle-status`,
      { tenantId: tenant, campaignId, targetStatus, author }
    ).subscribe({
      next: (res) => {
        const saved = res.campaign || fallbackUpdated;
        this.campaigns.update(curr => curr.map(c => c.id === saved.id ? saved : c));
        if (this.activeCampaign().id === campaignId) {
          this.activeCampaign.set(saved);
        }
        const actionLabel = targetStatus === 'Inactivo' ? 'pausada (Kill Switch activado)' : 'reactivada en producción';
        this.toastService.show(`✅ Campaña "${target?.name || campaignId}" ${actionLabel}. Manifiesto CDN actualizado.`);
        if (onSuccess) onSuccess();
      },
      error: (err) => {
        console.warn('Fallo petición toggle-status, actualizando estado en memoria:', err);
        this.campaigns.update(curr => curr.map(c => c.id === campaignId ? fallbackUpdated : c));
        if (this.activeCampaign().id === campaignId) {
          this.activeCampaign.set(fallbackUpdated);
        }
        const actionLabel = targetStatus === 'Inactivo' ? 'marcada como Inactiva' : 'marcada como Publicada';
        this.toastService.show(`⚠️ Servidor no disponible: Campaña "${target?.name || campaignId}" ${actionLabel} localmente.`);
        if (onSuccess) onSuccess();
      }
    });
  }

  // Pausar una campaña en vivo (Kill Switch)
  pauseCampaign(campaignId: string, onSuccess?: () => void): void {
    this.toggleCampaignStatus(campaignId, 'Inactivo', onSuccess);
  }

  // Reactivar una campaña pausada
  reactivateCampaign(campaignId: string, onSuccess?: () => void): void {
    this.toggleCampaignStatus(campaignId, 'Publicado', onSuccess);
  }

  private formatLocalDatetime(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
  }

  // Creación de nueva campaña gobernada (AP-05)
  createNewCampaign(type: CampaignType = 'Modal con slider', layout: PopupLayout = 'side'): Campaign {
    const tenant = this.tenantService.activeTenantId();
    const newId = 'camp-' + Date.now();
    const isBanner = layout === 'top';
    const newCamp: Campaign = {
      id: newId,
      name: isBanner ? ('Banner Horizontal ' + (this.campaigns().length + 1)) : ('Nueva Campaña ' + (this.campaigns().length + 1)),
      type,
      tenant,
      status: 'Borrador',
      version: 'v1',
      updated: 'Justo ahora',
      layout,
      rules: {
        delay: 1,
        frequency: 'once_per_session',
        pathRule: '*',
        startDate: this.formatLocalDatetime(new Date(Date.now() - 60 * 1000)),
        endDate: this.formatLocalDatetime(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        escToggle: true,
        autoplayToggle: true,
        dataLayerToggle: true
      },
      slides: [
        {
          id: 1,
          order: 1,
          active: true,
          name: isBanner ? 'Slide Banner 1' : 'Slide Principal',
          title: isBanner ? 'Aviso Vial Importante' : 'Título del Comunicado Oficial',
          description: isBanner ? 'Alerta ciudadana sobre cierres viales programados.' : 'Descripción detallada de la notificación para los ciudadanos.',
          cta: isBanner ? 'Ver desvíos' : 'Consultar aquí',
          link: 'https://www.quipux.com',
          target: '_blank',
          alt: 'Banner institucional',
          desktopName: 'banner-principal-desk.webp',
          mobileName: 'banner-principal-mob.webp',
          desktopPreview: null,
          mobilePreview: null
        }
      ]
    };

    this.activeCampaign.set(newCamp);
    this.selectedSlideId.set(1);
    this.previewIndex.set(0);
    this.saveDraft();
    return newCamp;
  }

  // AP-01: Flujo de Aprobación Formal (Editor -> Revisor -> Publicador)
  submitForReview(): void {
    const campaign = this.activeCampaign();
    this.activeCampaign.update(c => ({ ...c, status: 'En revisión', updated: 'Justo ahora' }));
    this.saveDraft();
    this.toastService.show(`📋 Campaña "${campaign.name}" enviada a revisión formal (AP-01)`);
  }

  approveCampaign(): void {
    const campaign = this.activeCampaign();
    this.activeCampaign.update(c => ({ ...c, status: 'Aprobado', updated: 'Justo ahora' }));
    this.saveDraft();
    this.toastService.show(`✅ Campaña "${campaign.name}" aprobada por Revisor para publicación (AP-01)`);
  }

  rejectToDraft(): void {
    const campaign = this.activeCampaign();
    this.activeCampaign.update(c => ({ ...c, status: 'Borrador', updated: 'Justo ahora' }));
    this.saveDraft();
    this.toastService.show(`↩️ Campaña "${campaign.name}" devuelta a estado Borrador`);
  }

  updateCampaignInList(updated: Campaign): void {
    this.campaigns.update(list => {
      const index = list.findIndex(c => c.id === updated.id);
      if (index >= 0) {
        const copy = [...list];
        copy[index] = { ...copy[index], ...updated };
        return copy;
      }
      return [updated, ...list];
    });
  }

  private markDirty(): void {
    this.saveStatus.set('Cambios sin guardar');
  }
}
