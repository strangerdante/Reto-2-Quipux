import { Injectable, computed, signal } from '@angular/core';
import { AVAILABLE_TENANTS, Tenant, UserRole, UserSession } from '../models/tenant.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  readonly tenants = signal<Tenant[]>(AVAILABLE_TENANTS);
  readonly activeTenantId = signal<string>('valle');

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
    return this.activeTenant().cdnPrefix;
  });

  constructor(private toastService: ToastService) {}

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
}
