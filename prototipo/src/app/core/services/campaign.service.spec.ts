import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CampaignService } from './campaign.service';
import { TenantService } from './tenant.service';
import { ToastService } from './toast.service';

describe('CampaignService', () => {
  let service: CampaignService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
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
});
