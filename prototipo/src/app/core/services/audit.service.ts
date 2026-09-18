import { Injectable, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { APP_CONFIG } from '../config/app-config';
import { TenantService } from './tenant.service';

export interface AuditEntry {
  id: string;
  timestamp: string;
  formattedTime: string;
  action: 'PUBLICACIÓN' | 'REVERSIÓN' | 'CREACIÓN' | 'EDICIÓN';
  campaignId: string;
  campaignName: string;
  version: string;
  user: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly tenantService = inject(TenantService);

  readonly auditEntries = signal<AuditEntry[]>([]);
  readonly isLoading = signal<boolean>(false);

  constructor() {
    // Al cambiar de tenant en el topbar, recargar la bitácora de ese tenant
    effect(() => {
      const tenant = this.tenantService.activeTenantId();
      this.loadAudit(tenant);
    });
  }

  loadAudit(tenantId?: string): void {
    const tenant = tenantId || this.tenantService.activeTenantId();
    this.isLoading.set(true);

    this.http.get<AuditEntry[]>(`${this.config.apiBaseUrl}/publish/audit?tenant=${tenant}`).subscribe({
      next: (entries) => {
        this.auditEntries.set(entries || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.warn('[AuditService] No se pudo cargar la bitácora:', err.message);
        this.isLoading.set(false);
      }
    });
  }
}
