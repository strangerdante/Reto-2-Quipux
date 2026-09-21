import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TenantService } from '@core/services/tenant.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <aside class="sidebar">
      <div class="brand-area">
        <img src="brand/logo-negativo.png" alt="Quipux" />
        <span>Component Studio</span>
      </div>

      <nav aria-label="Navegación principal">
        <p>GESTIÓN</p>
        <a class="nav-item" routerLink="/components" routerLinkActive="active">
          <span><lucide-icon name="layers" [size]="16"></lucide-icon></span>Componentes
        </a>
        <a class="nav-item" routerLink="/resources" routerLinkActive="active">
          <span><lucide-icon name="folder" [size]="16"></lucide-icon></span>Recursos CDN
        </a>

        <p>CONFIGURACIÓN</p>
        <a class="nav-item" routerLink="/integration" routerLinkActive="active">
          <span><lucide-icon name="zap" [size]="16"></lucide-icon></span>Integración GTM
        </a>
        <a class="nav-item" routerLink="/audit" routerLinkActive="active">
          <span><lucide-icon name="clock" [size]="16"></lucide-icon></span>Auditoría
        </a>
      </nav>

      <div class="user-card">
        <span class="avatar">{{ tenantService.currentUser().initials }}</span>
        <div>
          <strong>{{ tenantService.currentUser().name }}</strong>
          <small>{{ tenantService.currentUser().role }}</small>
        </div>
        <b>{{ tenantService.activeRole() }}</b>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      background: var(--ink);
      height: 100vh;
      color: var(--paper);
      flex-direction: column;
      padding: 30px 20px 18px;
      display: flex;
      position: sticky;
      top: 0;
      overflow: hidden;

      &:after {
        content: "";
        pointer-events: none;
        border: 1px solid rgba(97, 199, 208, 0.14);
        border-radius: 50%;
        width: 260px;
        height: 260px;
        position: absolute;
        bottom: 84px;
        left: -130px;
      }
    }

    .brand-area {
      z-index: 1;
      border-bottom: 1px solid rgba(255, 255, 255, 0.11);
      gap: 10px;
      padding: 0 8px 32px;
      display: grid;
      position: relative;

      img {
        width: 194px;
        height: auto;
        display: block;
      }

      span {
        color: var(--sky);
        letter-spacing: 0.2em;
        text-transform: uppercase;
        font: 700 10px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
      }
    }

    nav {
      z-index: 1;
      gap: 5px;
      margin-top: 24px;
      display: grid;
      position: relative;

      p {
        color: rgba(255, 255, 255, 0.38);
        letter-spacing: 0.18em;
        margin: 16px 12px 5px;
        font: 600 9px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
      }
    }

    .nav-item {
      color: rgba(255, 255, 255, 0.68);
      text-align: left;
      background: transparent;
      border: 0;
      border-radius: 9px;
      grid-template-columns: 27px 1fr auto;
      align-items: center;
      gap: 8px;
      width: 100%;
      min-height: 43px;
      padding: 9px 12px;
      font-size: 13px;
      font-weight: 700;
      transition: all 0.2s ease;
      display: grid;
      text-decoration: none;
      cursor: pointer;

      > span {
        width: 25px;
        height: 25px;
        color: var(--sky);
        place-items: center;
        font-size: 17px;
        display: grid;
      }

      &:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.06);
      }

      &.active {
        background: var(--paper);
        color: var(--ink);

        > span {
          color: var(--blue);
        }
      }

      &.muted {
        color: rgba(255, 255, 255, 0.42);
        cursor: default;

        &:hover {
          background: transparent;
        }
      }

      small {
        color: rgba(255, 255, 255, 0.42);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 4px;
        padding: 3px 5px;
        font-size: 7px;
      }
    }

    .user-card {
      z-index: 1;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      grid-template-columns: 34px 1fr auto;
      align-items: center;
      gap: 9px;
      margin-top: auto;
      margin-left: -2px;
      margin-right: -2px;
      margin-bottom: 0;
      padding: 14px 8px 0;
      display: grid;
      position: relative;

      .avatar {
        background: var(--sky);
        width: 34px;
        height: 34px;
        color: var(--ink);
        border-radius: 50%;
        place-items: center;
        font-size: 10px;
        font-weight: 900;
        display: grid;
      }

      div {
        gap: 2px;
        display: grid;
      }

      strong {
        font-size: 10px;
      }

      small {
        color: rgba(255, 255, 255, 0.48);
        font-size: 8px;
      }

      b {
        color: rgba(255, 255, 255, 0.4);
        font-size: 9px;
      }
    }

    @media (width <= 1180px) {
      .sidebar {
        padding-left: 12px;
        padding-right: 12px;
      }
      .brand-area img {
        width: 170px;
      }
    }

    @media (width <= 900px) {
      .sidebar {
        align-items: center;
        padding: 20px 9px 14px;
      }
      .brand-area {
        padding: 0 0 22px;
        img {
          display: none;
        }
        &:before {
          content: "";
          background: url('/brand/isologo.png') center/contain no-repeat;
          width: 36px;
          height: 36px;
          display: block;
        }
      }
      .brand-area > span,
      nav p,
      .nav-item:not(.active) small,
      .sidebar-principle,
      .user-card div,
      .user-card b {
        display: none;
      }
      nav {
        width: 100%;
      }
      .nav-item {
        grid-template-columns: 1fr;
        justify-items: center;
        padding: 8px 3px;
        font-size: 0;

        > span {
          font-size: 18px;
        }
      }
      .user-card {
        grid-template-columns: 1fr;
        justify-items: center;
        padding: 14px 0 0;
      }
    }
  `]
})
export class SidebarComponent {
  readonly tenantService = inject(TenantService);
}
