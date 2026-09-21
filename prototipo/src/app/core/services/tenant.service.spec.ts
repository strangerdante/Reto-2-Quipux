import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TenantService } from './tenant.service';
import { ToastService } from './toast.service';
import { APP_CONFIG, resolveAppConfig } from '../config/app-config';

describe('TenantService', () => {
  let service: TenantService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useFactory: resolveAppConfig },
        TenantService,
        ToastService
      ]
    });
    service = TestBed.inject(TenantService);
  });

  it('should initialize with default tenants', () => {
    expect(service).toBeTruthy();
    expect(service.tenants().length).toBeGreaterThanOrEqual(3);
    expect(service.activeTenantId()).toBe('valle');
    expect(service.activeTenant().name).toContain('Valle');
  });

  it('should switch active tenant correctly (AC-02)', () => {
    service.setTenant('medellin');
    expect(service.activeTenantId()).toBe('medellin');
    expect(service.activeTenant().name).toContain('Medellín');
  });

  it('should switch roles correctly (AP-01)', () => {
    service.setRole('Editor');
    expect(service.activeRole()).toBe('Editor');
    expect(service.currentUser().role).toBe('Editor');

    service.setRole('Revisor');
    expect(service.activeRole()).toBe('Revisor');
    expect(service.currentUser().role).toBe('Revisor');
  });

  it('should register a new tenant locally if offline or via mock', async () => {
    const initialCount = service.tenants().length;
    // Mocking fetch global for this test
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        success: true,
        tenant: {
          id: 'bucaramanga',
          name: 'Alcaldía de Bucaramanga',
          portalUrl: 'https://bucaramanga.gov.co'
        }
      })
    } as any);

    try {
      const created = await service.registerTenant({
        name: 'Alcaldía de Bucaramanga',
        id: 'bucaramanga'
      });
      expect(created.id).toBe('bucaramanga');
      expect(service.tenants().length).toBe(initialCount + 1);
      expect(service.activeTenantId()).toBe('bucaramanga');
      expect(service.activeTenant().name).toBe('Alcaldía de Bucaramanga');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
