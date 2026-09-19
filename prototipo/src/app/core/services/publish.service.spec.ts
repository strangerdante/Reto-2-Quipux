import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PublishService } from './publish.service';
import { CampaignService } from './campaign.service';
import { TenantService } from './tenant.service';
import { ToastService } from './toast.service';
import { APP_CONFIG, resolveAppConfig } from '../config/app-config';

describe('PublishService', () => {
  let service: PublishService;
  let campaignService: CampaignService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useFactory: resolveAppConfig },
        PublishService,
        CampaignService,
        TenantService,
        ToastService
      ]
    });
    service = TestBed.inject(PublishService);
    campaignService = TestBed.inject(CampaignService);
  });

  it('should be created and have preflight checks', () => {
    expect(service).toBeTruthy();
    const checks = service.preflightChecks();
    expect(checks.length).toBeGreaterThanOrEqual(4);
  });

  it('should toggle publish dialog', () => {
    expect(service.isPublishOpen()).toBe(false);
    service.openPublishDialog();
    expect(service.isPublishOpen()).toBe(true);
    service.closePublishDialog();
    expect(service.isPublishOpen()).toBe(false);
  });

  it('should compute preflight checks based on campaign completeness', () => {
    const checks = service.preflightChecks();
    expect(checks.length).toBe(5);
    expect(checks[0].label).toContain('enlaces válidos');
    expect(checks[4].label).toContain('solapamiento');
  });

  it('should evaluate conflict warning and allow dismissing it', () => {
    expect(service.conflictDismissed()).toBe(false);
    service.dismissConflict();
    expect(service.conflictDismissed()).toBe(true);
  });
});
