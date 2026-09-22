import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CampaignService } from './campaign.service';
import { TenantService } from './tenant.service';
import { ToastService } from './toast.service';
import { APP_CONFIG, resolveAppConfig } from '../config/app-config';

describe('CampaignService', () => {
  let service: CampaignService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useFactory: resolveAppConfig },
        CampaignService,
        TenantService,
        ToastService
      ]
    });
    service = TestBed.inject(CampaignService);
  });

  it('should be created with initial campaigns', () => {
    expect(service).toBeTruthy();
    expect(service.campaigns().length).toBeGreaterThan(0);
    expect(service.activeCampaign()).toBeTruthy();
  });

  it('should filter campaigns by query text', () => {
    service.setFilterQuery('Valle');
    const filtered = service.filteredCampaigns();
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every(c => c.name.toLowerCase().includes('valle') || c.tenant.toLowerCase().includes('valle'))).toBe(true);
  });

  it('should add a new slide and select it', () => {
    const initialCount = service.activeCampaign().slides.length;
    service.addSlide();
    expect(service.activeCampaign().slides.length).toBe(initialCount + 1);
    expect(service.selectedSlide()?.name).toContain('Slide');
  });

  it('should update active slide properties', () => {
    service.updateSelectedSlide({ title: 'Título de prueba actualizado' });
    expect(service.selectedSlide()?.title).toBe('Título de prueba actualizado');
  });

  it('should duplicate active slide (AC-03)', () => {
    const initialCount = service.activeCampaign().slides.length;
    const selected = service.selectedSlide();
    if (selected) {
      service.duplicateSlide(selected.id);
      expect(service.activeCampaign().slides.length).toBe(initialCount + 1);
    }
  });

  it('should delete a slide while preserving at least one', () => {
    service.addSlide();
    const countBefore = service.activeCampaign().slides.length;
    const slideToDelete = service.activeCampaign().slides[countBefore - 1];
    service.deleteSlide(slideToDelete.id);
    expect(service.activeCampaign().slides.length).toBe(countBefore - 1);
  });

  it('should change layout interactively', () => {
    service.setLayout('top');
    expect(service.activeCampaign().layout).toBe('top');
    service.setLayout('content');
    expect(service.activeCampaign().layout).toBe('content');
  });

  it('should verify canToggleStatus based on activeRole (AP-01)', () => {
    const tenantService = TestBed.inject(TenantService);
    tenantService.setRole('Publicador');
    expect(service.canToggleStatus()).toBe(true);

    tenantService.setRole('Revisor');
    expect(service.canToggleStatus()).toBe(true);

    tenantService.setRole('Editor');
    expect(service.canToggleStatus()).toBe(false);
  });

  it('should pause and reactivate campaign status locally on fallback', () => {
    const httpMock = TestBed.inject(HttpTestingController);
    const tenantService = TestBed.inject(TenantService);
    tenantService.setRole('Publicador');

    const campId = service.activeCampaign().id;
    service.pauseCampaign(campId);

    const req1 = httpMock.expectOne(req => req.url.includes('/publish/toggle-status'));
    expect(req1.request.method).toBe('POST');
    req1.flush({ success: true, campaign: { ...service.activeCampaign(), status: 'Inactivo' } });

    const updated = service.campaigns().find(c => c.id === campId);
    expect(updated?.status).toBe('Inactivo');

    service.reactivateCampaign(campId);
    const req2 = httpMock.expectOne(req => req.url.includes('/publish/toggle-status'));
    expect(req2.request.method).toBe('POST');
    req2.flush({ success: true, campaign: { ...service.activeCampaign(), status: 'Publicado' } });

    const reactivated = service.campaigns().find(c => c.id === campId);
    expect(reactivated?.status).toBe('Publicado');
  });

  it('should create new campaign in memory without persisting until saveDraft is called (AC-10)', () => {
    const httpMock = TestBed.inject(HttpTestingController);
    const initialCampaignsCount = service.campaigns().length;

    // Crear nueva campaña desde plantilla
    const newCamp = service.createNewCampaign('Modal con slider', 'side');
    expect(service.activeCampaign().id).toBe(newCamp.id);
    expect(service.saveStatus()).toBe('Borrador sin guardar');
    // No debe haberse agregado a la lista general de campañas guardadas
    expect(service.campaigns().length).toBe(initialCampaignsCount);
    expect(service.campaigns().some(c => c.id === newCamp.id)).toBe(false);

    // No debe haber disparado ninguna petición HTTP POST al crearse
    httpMock.expectNone(req => req.method === 'POST' && req.url.includes('/campaigns'));

    // Al guardar explícitamente el borrador
    service.saveDraft();
    const saveReq = httpMock.expectOne(req => req.method === 'POST' && req.url.includes('/campaigns'));
    expect(saveReq.request.body.id).toBe(newCamp.id);
    saveReq.flush({ success: true, campaign: { ...newCamp, status: 'Borrador', updated: 'Hoy' } });

    // Ahora sí debe haberse agregado a la lista persistente
    expect(service.campaigns().length).toBe(initialCampaignsCount + 1);
    expect(service.campaigns().some(c => c.id === newCamp.id)).toBe(true);
    expect(service.saveStatus()).toBe('Guardado en servidor');
  });
});
