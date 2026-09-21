import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { APP_CONFIG } from '../config/app-config';
import { AVAILABLE_TENANTS, Tenant, UserRole, UserSession } from '../models/tenant.model';
import { ToastService } from './toast.service';
import { catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private readonly config = inject(APP_CONFIG);
  private readonly http = inject(HttpClient, { optional: true });
  private readonly toastService = inject(ToastService);

  readonly tenants = signal<Tenant[]>(AVAILABLE_TENANTS);
  readonly activeTenantId = signal<string>('valle');
  readonly isRegistering = signal<boolean>(false);

  // AP-01: Gestión de roles de usuario
  readonly activeRole = signal<UserRole>('Publicador');

  readonly currentUser = computed<UserSession>(() => {
    const role = this.activeRole();
    if (role === 'Publicador') {
      return { name: 'Angie Ríos', role: 'Publicador', initials: 'AR' };
    }
    if (role === 'Revisor') {
      return { name: 'Sebastián Mora', role: 'Revisor', initials: 'SM' };
    }
    return { name: 'Diseñadora UI', role: 'Editor', initials: 'UI' };
  });

  readonly activeTenant = computed(() => {
    const id = this.activeTenantId();
    return this.tenants().find(t => t.id === id) ?? this.tenants()[0];
  });

  readonly cdnBasePath = computed(() => {
    return `${this.config.cdnBaseUrl}/resources/tenants/${this.activeTenantId()}`;
  });

  constructor() {
    this.loadTenants();
  }

  loadTenants(): void {
    if (this.http) {
      this.http.get<Tenant[]>(`${this.config.apiBaseUrl}/tenants`).pipe(
        catchError(() => of(AVAILABLE_TENANTS))
      ).subscribe({
        next: (list) => {
          if (Array.isArray(list) && list.length > 0) {
            this.tenants.set(list);
          }
        }
      });
    }
  }

  setTenant(id: string): void {
    const found = this.tenants().find(t => t.id === id);
    if (found) {
      this.activeTenantId.set(id);
      this.toastService.show(`Tenant cambiado a: ${found.name}`);
    }
  }

  setRole(role: UserRole): void {
    this.activeRole.set(role);
    this.toastService.show(`Rol cambiado a: ${role}`);
  }

  async registerTenant(data: { id?: string; name: string; portalUrl?: string; logoUrl?: string }): Promise<Tenant> {
    this.isRegistering.set(true);
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!response.ok || !result.tenant) {
        throw new Error(result.error || 'Error al registrar portal');
      }

      const newTenant: Tenant = result.tenant;
      this.tenants.update(list => [...list.filter(t => t.id !== newTenant.id), newTenant]);
      this.activeTenantId.set(newTenant.id);
      this.toastService.show(`🎉 Portal registrado exitosamente: ${newTenant.name}`);
      return newTenant;
    } catch (err: any) {
      const message = err?.message || 'No se pudo registrar el nuevo portal';
      this.toastService.show(`❌ Error: ${message}`);
      throw err;
    } finally {
      this.isRegistering.set(false);
    }
  }
}
