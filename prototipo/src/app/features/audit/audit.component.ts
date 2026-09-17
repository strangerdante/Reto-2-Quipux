import { Component, inject } from '@angular/core';
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
            Registro inmutable de publicaciones, reversiones y cambios de estado por tenant.
            Cumple con el criterio <strong>AC-15</strong> de gobierno de datos y trazabilidad operativa.
          </p>
        </div>
        <button class="q-button outline" (click)="auditService.loadAudit()">
          <lucide-icon name="refresh-cw" [size]="15"></lucide-icon> Actualizar bitácora
        </button>
      </div>

      <div class="tenant-badge-bar">
        <span>Tenant activo:</span>
        <strong>{{ tenantService.activeTenant().name }}</strong>
        <code>{{ tenantService.activeTenantId() }}</code>
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
            @if (auditService.auditEntries().length === 0) {
              <tr>
                <td colspan="6" class="empty-state">
                  <div class="empty-box">
                    <lucide-icon name="clock" [size]="28"></lucide-icon>
                    <p>No se registran eventos de auditoría para este tenant todavía.</p>
                  </div>
                </td>
              </tr>
            }
            @for (item of auditService.auditEntries(); track item.id) {
              <tr>
                <td class="date-col">
                  <strong>{{ item.formattedTime || (item.timestamp | date:'short') }}</strong>
                </td>
                <td>
                  <span class="action-badge" [class.publish]="item.action === 'PUBLICACIÓN'" [class.rollback]="item.action === 'REVERSIÓN'">
                    {{ item.action }}
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
      gap: 24px;
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

    .tenant-badge-bar {
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px 16px;
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

    .action-badge {
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;

      &.publish {
        background: rgba(93, 201, 154, 0.2);
        color: #1b7a4e;
      }

      &.rollback {
        background: rgba(245, 158, 11, 0.2);
        color: #b45309;
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

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }
}
