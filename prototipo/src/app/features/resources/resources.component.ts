import { Component, inject } from '@angular/core';
import { ResourceService } from '@core/services/resource.service';
import { TenantService } from '@core/services/tenant.service';
import { ToastService } from '@core/services/toast.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-resources',
  imports: [LucideAngularModule],
  template: `
    <div class="page-content">
      <div class="page-heading">
        <div>
          <span class="eyebrow">ALMACENAMIENTO MULTITENANT</span>
          <h1>Recursos en CDN</h1>
          <p>
            Estructura de aislamiento por tenant. Los recursos de <strong>{{ tenantService.activeTenant().name }}</strong>
            se publican de forma versionada bajo <code>resources/tenants/{{ tenantService.activeTenantId() }}/</code>.
          </p>
        </div>
        <div>
          <button class="q-button primary" (click)="fileInput.click()">
            <lucide-icon name="upload" [size]="15"></lucide-icon> Cargar recurso
          </button>
          <input #fileInput type="file" accept="image/webp,image/png,image/jpeg" (change)="onFileSelected($event)" style="display:none" />
        </div>
      </div>

      <!-- Ruta raíz CDN -->
      <div class="resource-root">
        <span>RUTA RAÍZ CDN</span>
        <code>{{ resourceService.rootPath() }}</code>
        <button (click)="copyRootPath()" style="display: inline-flex; align-items: center; gap: 4px;">
          <lucide-icon name="copy" [size]="12"></lucide-icon> Copiar URL
        </button>
      </div>

      <!-- Cuadrícula de carpetas del tenant -->
      <section class="folder-grid">
        @for (f of resourceService.folders(); track f.id) {
          <article>
            <span><lucide-icon name="folder" [size]="20"></lucide-icon></span>
            <div>
              <strong>{{ f.name }}</strong>
              <small>{{ f.path }}</small>
            </div>
            <b>{{ f.fileCount }} archivos</b>
          </article>
        }
      </section>

      <!-- Layout de árbol y assets -->
      <div class="resource-layout">
        <section class="tree-card">
          <div class="card-heading">
            <strong>Árbol del Tenant</strong>
            <button (click)="reloadTree()" style="display: inline-flex; align-items: center; gap: 4px;">
              <lucide-icon name="refresh-cw" [size]="12"></lucide-icon> Recargar árbol
            </button>
          </div>
          <pre>
resources/
└── tenants/
    └── {{ tenantService.activeTenantId() }}/
        ├── brand/
        │   ├── isologo.png
        │   └── logo-negativo.png
        └── components/
            └── modal/
                └── {{ campaignSlug() }}/
                    ├── manifest.json
                    ├── v12/
                    │   ├── cobro-coactivo-desktop.webp
                    │   └── cobro-coactivo-mobile.webp
                    └── v11/
                        └── tramites-desktop.webp
          </pre>
        </section>

        <section class="asset-card">
          <div class="card-heading">
            <strong>Assets en este componente</strong>
            <b>{{ resourceService.assets().length }} ARCHIVOS</b>
          </div>

          @for (asset of resourceService.assets(); track asset.id) {
            <div class="asset-row">
              <span class="asset-kind">{{ asset.type }}</span>
              <span>
                <strong>{{ asset.name }}</strong>
                <small>{{ asset.dimensions }} · {{ asset.size }}</small>
              </span>
              <b>{{ asset.status }}</b>
              <button (click)="copyAssetPath(asset.cdnPath)" title="Copiar ruta">
                <lucide-icon name="copy" [size]="14"></lucide-icon>
              </button>
            </div>
          }
        </section>
      </div>

      <!-- Nota de seguridad -->
      <div class="security-note">
        <span aria-hidden="true"><lucide-icon name="shield-check" [size]="16"></lucide-icon></span>
        <div>
          <strong>Aislamiento estricto multitenant</strong>
          <p>
            Cada tenant cuenta con su propio namespace en el CDN. El cargador de GTM valida los encabezados
            CORS y rechaza referencias cruzadas entre tenants diferentes para garantizar soberanía de datos.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-content {
      width: min(1500px, 100%);
      margin: 0 auto;
      padding: 34px clamp(24px, 3vw, 46px) 54px;
    }

    .page-heading {
      justify-content: space-between;
      align-items: flex-start;
      gap: 30px;
      margin-bottom: 28px;
      display: flex;

      h1 {
        color: var(--ink);
        letter-spacing: -0.035em;
        margin: 0;
        font-size: clamp(28px, 3vw, 40px);
        font-weight: 900;
        line-height: 1.1;
      }

      p {
        color: #6f6b74;
        max-width: 690px;
        margin: 10px 0 0;
        font-size: 13px;
        line-height: 1.55;
      }
    }

    .resource-root {
      border: 1px solid var(--line);
      background: #fff;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 13px;
      margin-bottom: 18px;
      padding: 13px 18px;
      display: grid;
      border-radius: 8px;

      span {
        color: var(--sub);
        letter-spacing: 0.12em;
        text-transform: uppercase;
        font: 700 8.5px/1 ui-monospace, monospace;
      }

      code {
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--ink);
        font-size: 11px;
        overflow: hidden;
      }

      button {
        color: var(--blue);
        background: transparent;
        border: 0;
        font-size: 10px;
        font-weight: 900;
        cursor: pointer;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .folder-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 18px;
      display: grid;

      article {
        border: 1px solid var(--line);
        background: #fff;
        grid-template-columns: 40px 1fr auto;
        align-items: center;
        gap: 11px;
        padding: 16px;
        display: grid;
        border-radius: 8px;

        > span {
          background: var(--cool);
          width: 40px;
          height: 40px;
          color: var(--blue);
          place-items: center;
          font-size: 18px;
          display: grid;
          border-radius: 6px;
        }

        div {
          gap: 3px;
          display: grid;

          strong {
            color: var(--ink);
            font-size: 12px;
          }

          small {
            color: #8b8690;
            font-size: 9px;
          }
        }

        b {
          color: var(--blue);
          font-size: 10px;
        }
      }
    }

    .resource-layout {
      grid-template-columns: 0.85fr 1.15fr;
      gap: 14px;
      display: grid;
    }

    .tree-card, .asset-card {
      border: 1px solid var(--line);
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
    }

    .card-heading {
      border-bottom: 1px solid var(--line);
      justify-content: space-between;
      align-items: center;
      min-height: 57px;
      padding: 13px 18px;
      display: flex;

      strong {
        color: var(--ink);
        font-size: 13px;
        font-weight: 800;
      }

      button {
        color: var(--blue);
        background: transparent;
        border: 0;
        font-size: 10px;
        font-weight: 900;
        cursor: pointer;
      }

      b {
        color: #77727b;
        text-transform: uppercase;
        background: #f0eff2;
        padding: 4px 8px;
        font-size: 8.5px;
        border-radius: 4px;
      }
    }

    .tree-card pre {
      background: var(--ink);
      color: #e6e2f2;
      min-height: 286px;
      margin: 0;
      padding: 19px 22px;
      font: 11px/1.85 ui-monospace, SFMono-Regular, Menlo, monospace;
      overflow: auto;
    }

    .asset-row {
      border-top: 1px solid var(--line-soft);
      grid-template-columns: 45px 1fr auto 28px;
      align-items: center;
      gap: 10px;
      min-height: 65px;
      padding: 9px 18px;
      display: grid;

      &:first-of-type {
        border-top: 0;
      }

      .asset-kind {
        background: var(--cool);
        width: 42px;
        height: 35px;
        color: var(--purple);
        place-items: center;
        font: 900 11px/1 ui-monospace, monospace;
        display: grid;
        border-radius: 4px;
      }

      > span:nth-child(2) {
        gap: 3px;
        display: grid;

        strong {
          color: var(--ink);
          font-size: 11px;
        }

        small {
          color: #8b8690;
          font-size: 9.5px;
        }
      }

      b {
        color: #1f6e48;
        font-size: 9px;
        background: rgba(93, 201, 154, 0.15);
        padding: 4px 8px;
        border-radius: 99px;
      }

      button {
        color: var(--sub);
        background: transparent;
        border: 0;
        font-size: 14px;
        cursor: pointer;

        &:hover {
          color: var(--blue);
        }
      }
    }

    .security-note {
      border-left: 3px solid var(--green);
      background: rgba(93, 201, 154, 0.12);
      gap: 14px;
      margin-top: 18px;
      padding: 16px 20px;
      display: flex;
      border-radius: 6px;

      span {
        color: #fff;
        background: #1f8a5b;
        border-radius: 50%;
        flex: none;
        place-items: center;
        width: 28px;
        height: 28px;
        font-size: 12px;
        display: grid;
      }

      strong {
        color: #1f6e48;
        font-size: 12px;
        font-weight: 800;
      }

      p {
        color: #3b604e;
        margin: 4px 0 0;
        font-size: 10.5px;
        line-height: 1.5;
      }
    }

    @media (width <= 900px) {
      .folder-grid {
        grid-template-columns: 1fr;
      }
      .resource-layout {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ResourcesComponent {
  readonly resourceService = inject(ResourceService);
  readonly tenantService = inject(TenantService);
  private readonly toastService = inject(ToastService);

  campaignSlug(): string {
    return 'plan-de-cobro-2026';
  }

  copyRootPath(): void {
    navigator.clipboard?.writeText(this.resourceService.rootPath());
    this.toastService.show('URL raíz CDN copiada al portapapeles');
  }

  copyAssetPath(path: string): void {
    navigator.clipboard?.writeText(path);
    this.toastService.show('Ruta del asset copiada');
  }

  reloadTree(): void {
    this.toastService.show('Árbol de recursos sincronizado con CDN');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.resourceService.uploadImage(input.files[0], 'desktop');
      input.value = '';
    }
  }
}
