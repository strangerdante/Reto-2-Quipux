import { Component, inject } from '@angular/core';
import { TenantService } from '@core/services/tenant.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-topbar',
  imports: [LucideAngularModule],
  template: `
    <header class="global-topbar">
      <div class="portal-context">
        @if (tenantService.activeTenant().logoUrl) {
          <div class="tenant-logo-badge">
            <img [src]="tenantService.activeTenant().logoUrl" [alt]="tenantService.activeTenant().name" />
          </div>
        } @else {
          <span class="context-dot" aria-hidden="true"></span>
        }
        <div>
          <small>Portal activo</small>
          <strong>{{ tenantService.activeTenant().name }} ({{ tenantService.activeTenant().portalUrl }})</strong>
        </div>
      </div>

      <div class="topbar-tools">
        <label>
          <span>TENANT / CLIENTE</span>
          <select [value]="tenantService.activeTenantId()" (change)="onTenantChange($event)">
            @for (t of tenantService.tenants(); track t.id) {
              <option [value]="t.id">{{ t.name }}</option>
            }
          </select>
        </label>

        <label>
          <span>ROL (AP-01)</span>
          <select [value]="tenantService.activeRole()" (change)="onRoleChange($event)" class="role-select">
            <option value="Publicador">Publicador</option>
            <option value="Revisor">Revisor</option>
            <option value="Editor">Editor</option>
          </select>
        </label>

        <button class="circle-button notification" title="Notificaciones" aria-label="Notificaciones" style="display: flex; align-items: center; justify-content: center;">
          <lucide-icon name="bell" [size]="15"></lucide-icon>
        </button>
        <button class="circle-button" title="Ayuda y documentación" style="display: flex; align-items: center; justify-content: center;">
          <lucide-icon name="circle-help" [size]="15"></lucide-icon>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .global-topbar {
      border-bottom: 1px solid var(--line);
      background: var(--paper);
      justify-content: space-between;
      align-items: center;
      height: 72px;
      padding: 0 30px;
      display: flex;
    }

    .portal-context {
      align-items: center;
      gap: 10px;
      display: flex;

      .tenant-logo-badge {
        width: 36px;
        height: 36px;
        min-width: 36px;
        background: transparent;
        border: none;
        border-radius: 0;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: none;

        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2));
        }
      }

      .context-dot {
        background: var(--green);
        border-radius: 50%;
        width: 9px;
        height: 9px;
        box-shadow: 0 0 0 5px rgba(93, 201, 154, 0.2);
        flex-shrink: 0;
      }

      div {
        gap: 2px;
        display: grid;
      }

      small {
        color: var(--sub);
        letter-spacing: 0.14em;
        text-transform: uppercase;
        font: 600 8px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
      }

      strong {
        color: var(--ink);
        font-size: 12px;
        font-weight: 800;
      }
    }

    .topbar-tools {
      align-items: center;
      gap: 10px;
      display: flex;

      label {
        gap: 3px;
        display: grid;

        span {
          color: var(--sub);
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font: 600 8px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
        }

        select {
          border: 1px solid var(--line);
          min-width: 190px;
          color: var(--ink);
          background: #fbfbfc;
          border-radius: 7px;
          padding: 7px 12px;
          font-size: 11px;
          font-weight: 700;
          outline: none;
          cursor: pointer;

          &:focus {
            border-color: var(--blue);
          }
        }
      }

      .circle-button {
        border: 1px solid var(--line);
        background: var(--paper);
        width: 34px;
        height: 34px;
        color: var(--ink);
        border-radius: 50%;
        font-size: 12px;
        font-weight: 900;
        display: grid;
        place-items: center;
        transition: background 0.15s ease;

        &:hover {
          background: #f4f3f6;
        }

        &.notification {
          color: var(--blue);
          font-size: 12px;
          position: relative;

          &:after {
            content: "";
            background: var(--orange);
            border: 2px solid #fff;
            border-radius: 50%;
            width: 7px;
            height: 7px;
            position: absolute;
            top: 5px;
            right: 5px;
          }
        }
      }
    }

    @media (width <= 620px) {
      .global-topbar {
        padding: 0 14px;
      }
      .portal-context strong {
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 150px;
        overflow: hidden;
      }
      .topbar-tools label {
        display: none;
      }
    }
  `]
})
export class TopbarComponent {
  readonly tenantService = inject(TenantService);

  onTenantChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.tenantService.setTenant(val);
  }

  onRoleChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as any;
    this.tenantService.setRole(val);
  }
}
