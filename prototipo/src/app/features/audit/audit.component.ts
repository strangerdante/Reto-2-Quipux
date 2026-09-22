import { Component, computed, inject, signal } from '@angular/core';
import { AuditService } from '@core/services/audit.service';
import { TenantService } from '@core/services/tenant.service';
import { LucideAngularModule } from 'lucide-angular';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-audit',
  imports: [LucideAngularModule, DatePipe],
  template: `
    <div class="page-content">
      <div class="page-heading">
        <div>
          <span class="eyebrow">AUDITORÍA Y GOBERNANZA</span>
          <h1>Bitácora de eventos y trazabilidad</h1>
          <p>
            Registro inmutable de publicaciones, reversiones, pausas, reactivaciones y cambios de estado por tenant.
            Cumple con el criterio <strong>AC-15</strong> de gobierno de datos y trazabilidad operativa.
          </p>
        </div>
        <button class="q-button outline" (click)="auditService.loadAudit()">
          <lucide-icon name="refresh-cw" [size]="15"></lucide-icon> Actualizar bitácora
        </button>
      </div>

      <div class="top-controls">
        <div class="tenant-badge-bar">
          <span>Tenant activo:</span>
          <strong>{{ tenantService.activeTenant().name }}</strong>
          <code>{{ tenantService.activeTenantId() }}</code>
        </div>

        <div class="search-box">
          <lucide-icon name="search" [size]="14"></lucide-icon>
          <input
            type="text"
            placeholder="Buscar por campaña, versión o usuario..."
            [value]="searchTerm()"
            (input)="onSearchInput($event)"
          />
          @if (searchTerm()) {
            <button class="clear-search" (click)="searchTerm.set('')">✕</button>
          }
        </div>
      </div>

      <!-- Barra de filtros rápidos por tipo de acción -->
      <div class="filter-pills-bar">
        <span class="filter-label">Filtrar por acción:</span>
        <button
          type="button"
          class="filter-pill"
          [class.active]="selectedAction() === 'TODAS'"
          (click)="selectedAction.set('TODAS')"
        >
          Todas ({{ auditService.auditEntries().length }})
        </button>
        <button
          type="button"
          class="filter-pill publish"
          [class.active]="selectedAction() === 'publish'"
          (click)="selectedAction.set('publish')"
        >
          Publicaciones
        </button>
        <button
          type="button"
          class="filter-pill rollback"
          [class.active]="selectedAction() === 'rollback'"
          (click)="selectedAction.set('rollback')"
        >
          Reversiones
        </button>
        <button
          type="button"
          class="filter-pill pause"
          [class.active]="selectedAction() === 'pause'"
          (click)="selectedAction.set('pause')"
        >
          Pausas
        </button>
        <button
          type="button"
          class="filter-pill reactivate"
          [class.active]="selectedAction() === 'reactivate'"
          (click)="selectedAction.set('reactivate')"
        >
          Reactivaciones
        </button>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Acción</th>
              <th>Campaña / Descripción</th>
              <th>Versión</th>
              <th>Usuario Responsable</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            @if (filteredEntries().length === 0) {
              <tr>
                <td colspan="6" class="empty-state">
                  <div class="empty-box">
                    <lucide-icon name="clock" [size]="28"></lucide-icon>
                    <p>
                      @if (auditService.auditEntries().length === 0) {
                        No se registran eventos de auditoría para este tenant todavía.
                      } @else {
                        No se encontraron eventos que coincidan con los filtros seleccionados.
                      }
                    </p>
                  </div>
                </td>
              </tr>
            }
            @for (item of filteredEntries(); track item.id) {
              <tr>
                <td class="date-col">
                  <strong>{{ item.formattedTime || (item.timestamp | date:'short') }}</strong>
                </td>
                <td>
                  <span class="action-badge" [class]="getActionClass(item.action)">
                    {{ formatAction(item.action) }}
                  </span>
                </td>
                <td>
                  <strong>{{ item.campaignName }}</strong>
                  <small>{{ item.campaignId }}</small>
                </td>
                <td>
                  <span class="version-tag">{{ item.version }}</span>
                </td>
                <td>
                  <div class="user-info">
                    <span class="avatar-sm">{{ getInitials(item.user) }}</span>
                    <span>{{ item.user }}</span>
                  </div>
                </td>
                <td>
                  <span class="role-badge">{{ item.role }}</span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page-content {
      padding: 30px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-heading {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      .eyebrow {
        color: var(--sky);
        letter-spacing: 0.14em;
        text-transform: uppercase;
        font: 700 10px/1.2 ui-monospace, monospace;
      }

      h1 {
        font-size: 24px;
        color: var(--ink);
        margin: 6px 0 8px;
        font-weight: 800;
      }

      p {
        color: var(--sub);
        font-size: 13px;
        max-width: 600px;
        margin: 0;
      }
    }

    .top-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .tenant-badge-bar {
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 9px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;

      strong {
        color: var(--quipux-blue, #2E13F5);
      }

      code {
        background: #f1f3f5;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
      }
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fff;
      border: 1.5px solid var(--line);
      border-radius: 8px;
      padding: 6px 12px;
      min-width: 280px;
      color: var(--sub);
      transition: border-color 0.15s ease;

      &:focus-within {
        border-color: var(--blue);
      }

      input {
        border: 0;
        outline: 0;
        font-size: 12px;
        color: var(--ink);
        width: 100%;
        background: transparent;

        &::placeholder {
          color: #9ca3af;
        }
      }

      .clear-search {
        background: transparent;
        border: 0;
        color: #9ca3af;
        cursor: pointer;
        font-size: 12px;
        padding: 0 4px;

        &:hover {
          color: var(--ink);
        }
      }
    }

    .filter-pills-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;

      .filter-label {
        font-size: 11px;
        font-weight: 700;
        color: var(--sub);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-right: 4px;
      }

      .filter-pill {
        border: 1px solid var(--line);
        background: #fff;
        color: #4b5563;
        font-size: 11px;
        font-weight: 700;
        padding: 5px 12px;
        border-radius: 99px;
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          background: #f8f9fa;
          border-color: #cbd5e1;
        }

        &.active {
          background: var(--ink, #211C33);
          color: #fff;
          border-color: var(--ink, #211C33);
        }

        &.publish.active {
          background: #1b7a4e;
          color: #fff;
          border-color: #1b7a4e;
        }

        &.rollback.active {
          background: #b45309;
          color: #fff;
          border-color: #b45309;
        }

        &.pause.active {
          background: #b91c1c;
          color: #fff;
          border-color: #b91c1c;
        }

        &.reactivate.active {
          background: var(--quipux-blue, #2E13F5);
          color: #fff;
          border-color: var(--quipux-blue, #2E13F5);
        }
      }
    }

    .table-container {
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: 10px;
      overflow: hidden;

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;

        th {
          background: #fafafa;
          border-bottom: 1px solid var(--line);
          padding: 12px 16px;
          text-align: left;
          color: var(--sub);
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--line);
          color: var(--ink);

          small {
            display: block;
            color: var(--sub);
            font-size: 11px;
          }
        }

        tr:last-child td {
          border-bottom: none;
        }
      }
    }

    /* Píldoras de acción con soporte para todas las opciones */
    .action-badge {
      font-size: 10px;
      font-weight: 800;
      padding: 3.5px 10px;
      border-radius: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: inline-block;
      white-space: nowrap;

      /* 1. Publicación (Verde menta / éxito) */
      &.publish {
        background: rgba(93, 201, 154, 0.2);
        color: #1b7a4e;
        border: 1px solid rgba(93, 201, 154, 0.45);
      }

      /* 2. Reversión / Rollback (Ámbar / advertencia) */
      &.rollback {
        background: rgba(245, 158, 11, 0.2);
        color: #b45309;
        border: 1px solid rgba(245, 158, 11, 0.45);
      }

      /* 3. Pausa de Campaña / Kill Switch (Rojo suave / detenido) */
      &.pause {
        background: rgba(239, 68, 68, 0.14);
        color: #b91c1c;
        border: 1px solid rgba(239, 68, 68, 0.35);
      }

      /* 4. Reactivación de Campaña (Azul Quipux / activo) */
      &.reactivate {
        background: rgba(46, 19, 245, 0.1);
        color: var(--quipux-blue, #2E13F5);
        border: 1px solid rgba(46, 19, 245, 0.3);
      }

      /* 5. Creación (Morado / índigo) */
      &.create {
        background: rgba(147, 51, 234, 0.14);
        color: #7e22ce;
        border: 1px solid rgba(147, 51, 234, 0.35);
      }

      /* 6. Edición / Modificación (Cian / Sky) */
      &.edit {
        background: rgba(14, 165, 233, 0.15);
        color: #0369a1;
        border: 1px solid rgba(14, 165, 233, 0.35);
      }

      /* 7. Eliminación (Rojo intenso) */
      &.delete {
        background: rgba(220, 38, 38, 0.18);
        color: #991b1b;
        border: 1px solid rgba(220, 38, 38, 0.4);
      }

      /* 8. Guardar Borrador (Gris / Slate) */
      &.draft {
        background: rgba(100, 116, 139, 0.14);
        color: #475569;
        border: 1px solid rgba(100, 116, 139, 0.3);
      }

      /* Fallback general para cualquier acción no tipada */
      &.default {
        background: #f1f3f5;
        color: #495057;
        border: 1px solid #dee2e6;
      }
    }

    .version-tag {
      font-weight: 800;
      color: var(--quipux-blue, #2E13F5);
      background: rgba(46, 19, 245, 0.08);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .avatar-sm {
        background: var(--ink);
        color: #fff;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        font-weight: 800;
      }
    }

    .role-badge {
      font-size: 11px;
      color: var(--sub);
      background: #f1f3f5;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .empty-state {
      text-align: center;
      padding: 60px !important;

      .empty-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        color: var(--sub);
      }
    }

    .q-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
      border: 1px solid var(--line);
      background: #fff;

      &.outline:hover {
        background: #f8f9fa;
      }
    }
  `]
})
export class AuditComponent {
  readonly auditService = inject(AuditService);
  readonly tenantService = inject(TenantService);

  readonly selectedAction = signal<string>('TODAS');
  readonly searchTerm = signal<string>('');

  readonly filteredEntries = computed(() => {
    const entries = this.auditService.auditEntries();
    const actionFilter = this.selectedAction();
    const term = this.searchTerm().trim().toLowerCase();

    return entries.filter(item => {
      // Filtrar por categoría de acción
      if (actionFilter !== 'TODAS') {
        const itemClass = this.getActionClass(item.action);
        if (itemClass !== actionFilter) return false;
      }

      // Filtrar por término de búsqueda (campaña, versión, usuario o acción)
      if (term) {
        const matchCamp = (item.campaignName || '').toLowerCase().includes(term);
        const matchCampId = (item.campaignId || '').toLowerCase().includes(term);
        const matchUser = (item.user || '').toLowerCase().includes(term);
        const matchAction = (item.action || '').toLowerCase().includes(term);
        const matchVersion = (item.version || '').toLowerCase().includes(term);
        return matchCamp || matchCampId || matchUser || matchAction || matchVersion;
      }

      return true;
    });
  });

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchTerm.set(val);
  }

  getActionClass(action: string): string {
    if (!action) return 'default';
    const a = action.toUpperCase();
    if (a.includes('PUBLICAC') || a === 'PUBLISH') return 'publish';
    if (a.includes('REVERS') || a.includes('ROLLBACK')) return 'rollback';
    if (a.includes('PAUSA') || a.includes('PAUSE') || a.includes('INACTIVO')) return 'pause';
    if (a.includes('REACTIV') || a.includes('REANUDAR')) return 'reactivate';
    if (a.includes('CREAC') || a.includes('NUEVA')) return 'create';
    if (a.includes('EDIC') || a.includes('MODIFIC') || a.includes('ACTUALIZ')) return 'edit';
    if (a.includes('ELIMIN') || a.includes('BORRA')) return 'delete';
    if (a.includes('BORRADOR') || a.includes('DRAFT')) return 'draft';
    return 'default';
  }

  formatAction(action: string): string {
    if (!action) return 'ACCIÓN';
    return action.replace(/_/g, ' ');
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }
}
