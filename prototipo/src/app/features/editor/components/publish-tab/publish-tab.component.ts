import { Component, computed, inject } from '@angular/core';
import { APP_CONFIG } from '@core/config/app-config';
import { CampaignService } from '@core/services/campaign.service';
import { PublishService } from '@core/services/publish.service';
import { ResourceService } from '@core/services/resource.service';
import { TenantService } from '@core/services/tenant.service';

@Component({
  selector: 'app-publish-tab',
  imports: [],
  template: `
    <div class="panel-heading">
      <h2>Publicación y versiones</h2>
    </div>
    <p class="panel-copy">
      Cada publicación compila un nuevo manifiesto JSON inmutable en el CDN de {{ tenantService.activeTenant().name }}.
    </p>

    <!-- Manifest card -->
    <div class="manifest-card">
      <span>MANIFIESTO ACTIVO EN CDN (AC-12)</span>
      <code>{{ manifestUrl() }}</code>
      <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
        <small>Estado: En sincronía con portal</small>
        <button class="mini-button" (click)="openManifestMock()">Ver payload real ↗</button>
        <button class="mini-button" style="background: var(--blue); color: #fff; border-color: var(--blue);" (click)="openPortalDemo()">Probar en Portal Demo (AC-12) ↗</button>
      </div>
    </div>

    <!-- Flujo de Aprobación por Roles (AP-01) -->
    <div class="manifest-card" style="margin-bottom: 16px;">
      <span>GOBERNANZA Y ESTADO DE APROBACIÓN (AP-01)</span>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <strong style="font-size: 13px; color: var(--ink);">Estado:</strong>
          <span class="q-badge" [class]="campaignService.activeCampaign().status.toLowerCase().replace(' ', '-')">
            {{ campaignService.activeCampaign().status }}
          </span>
          <small style="color: #64748B;">Rol: <strong>{{ tenantService.activeRole() }}</strong></small>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          @if (tenantService.activeRole() === 'Editor' && campaignService.activeCampaign().status !== 'En revisión' && campaignService.activeCampaign().status !== 'Aprobado') {
            <button class="mini-button" style="background: var(--blue); color: #fff; border-color: var(--blue);" (click)="campaignService.submitForReview()">
              Solicitar Aprobación (Editor)
            </button>
          }

          @if (tenantService.activeRole() === 'Revisor') {
            @if (campaignService.activeCampaign().status !== 'Aprobado') {
              <button class="mini-button" style="background: #059669; color: #fff; border-color: #059669;" (click)="campaignService.approveCampaign()">
                Aprobar para Publicar (Revisor)
              </button>
            }
            @if (campaignService.activeCampaign().status === 'En revisión' || campaignService.activeCampaign().status === 'Aprobado') {
              <button class="mini-button" (click)="campaignService.rejectToDraft()">
                Devolver a Borrador
              </button>
            }
          }
        </div>
      </div>
    </div>

    <!-- Explainer box -->
    <div class="publish-explainer">
      <h3>¿Cómo se refleja en el portal sin tocar GTM?</h3>
      <div>
        <span>01</span>
        <p>
          <strong>1. Compilación del manifiesto</strong>
          El editor consolida textos, assets y reglas en un JSON versionado.
        </p>
      </div>
      <div>
        <span>02</span>
        <p>
          <strong>2. Distribución CDN multitenant</strong>
          Se guarda el release bajo la carpeta del tenant con hash verificable.
        </p>
      </div>
      <div>
        <span>03</span>
        <p>
          <strong>3. Consumo dinámico</strong>
          El cargador de GTM consulta el manifest activo y monta el modal en la SPA.
        </p>
      </div>
    </div>

    <!-- Historial de versiones y rollback -->
    <span class="field-label" style="margin-top: 18px;">Historial de publicaciones y reversión</span>
    <div class="version-list">
      @for (ver of publishService.versions(); track ver.id) {
        <div class="version-row" [class.current]="ver.isCurrent">
          <b>{{ ver.version }}</b>
          <span>
            <strong>{{ ver.author }} · {{ ver.timestamp }}</strong>
            <small>{{ ver.summary }}</small>
          </span>
          @if (ver.isCurrent) {
            <em>Activa</em>
          } @else {
            <button (click)="publishService.rollbackToVersion(ver.version)">
              Revertir
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .panel-heading h2 {
      color: var(--ink);
      letter-spacing: -0.025em;
      margin: 0;
      font-size: 20px;
      font-weight: 900;
    }

    .panel-copy {
      color: #7d7882;
      margin: 8px 0 20px;
      font-size: 11px;
      line-height: 1.5;
    }

    .field-label {
      color: var(--ink);
      margin-bottom: 8px;
      font-size: 11px;
      font-weight: 800;
      display: block;
    }

    .manifest-card {
      border: 1px solid var(--line);
      background: var(--ink);
      color: #fff;
      gap: 7px;
      padding: 14px;
      display: grid;
      border-radius: 6px;

      span {
        color: var(--sky);
        letter-spacing: 0.13em;
        font: 700 8px/1 ui-monospace, monospace;
      }

      code {
        word-break: break-all;
        color: #fff;
        font-size: 10px;
      }

      div {
        justify-content: space-between;
        align-items: center;
        display: flex;
        margin-top: 5px;

        small {
          color: rgba(255, 255, 255, 0.48);
          font-size: 8.5px;
        }

        button {
          color: var(--sky);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(97, 199, 208, 0.3);
          padding: 4px 8px;
          font-size: 8.5px;
          font-weight: 800;
          border-radius: 4px;
          cursor: pointer;

          &:hover {
            background: rgba(255, 255, 255, 0.2);
          }
        }
      }
    }

    .publish-explainer {
      background: #f7f6f8;
      margin: 16px 0;
      padding: 14px;
      border-radius: 6px;

      h3 {
        color: var(--ink);
        margin: 0 0 10px;
        font-size: 12px;
        font-weight: 800;
      }

      > div {
        grid-template-columns: 24px 1fr;
        align-items: start;
        gap: 10px;
        margin-top: 10px;
        display: grid;

        span {
          background: #fff;
          border: 1px solid var(--line);
          width: 24px;
          height: 24px;
          color: var(--blue);
          place-items: center;
          font-size: 9px;
          font-weight: 900;
          display: grid;
          border-radius: 4px;
        }

        p {
          color: #79747d;
          gap: 2px;
          margin: 0;
          font-size: 10px;
          line-height: 1.4;
          display: grid;

          strong {
            color: var(--ink);
            font-size: 10.5px;
          }
        }
      }
    }

    .version-list {
      border: 1px solid var(--line);
      border-radius: 6px;
      overflow: hidden;
    }

    .version-row {
      border-top: 1px solid var(--line-soft);
      grid-template-columns: 35px 1fr auto;
      align-items: center;
      gap: 10px;
      min-height: 61px;
      padding: 9px 12px;
      display: grid;

      &:first-child {
        border-top: 0;
      }

      > b {
        width: 35px;
        height: 35px;
        color: var(--ink);
        background: #f0eff2;
        place-items: center;
        font: 900 10px/1 ui-monospace, monospace;
        display: grid;
        border-radius: 4px;
      }

      > span {
        gap: 3px;
        display: grid;

        strong {
          color: var(--ink);
          font-size: 11px;
        }

        small {
          color: var(--sub);
          font-size: 9.5px;
        }
      }

      em {
        color: #1f6e48;
        background: rgba(93, 201, 154, 0.2);
        padding: 4px 8px;
        font-size: 9px;
        font-style: normal;
        border-radius: 4px;
        font-weight: 800;
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

      &.current {
        background: rgba(93, 201, 154, 0.08);

        > b {
          background: var(--green);
          color: var(--ink);
        }
      }
    }
  `]
})
export class PublishTabComponent {
  readonly campaignService = inject(CampaignService);
  readonly tenantService = inject(TenantService);
  readonly publishService = inject(PublishService);
  readonly resourceService = inject(ResourceService);
  private readonly config = inject(APP_CONFIG);

  readonly manifestUrl = computed(() => `${this.config.cdnBaseUrl}/resources/tenants/${this.tenantService.activeTenantId()}/manifests/${this.campaignService.activeCampaign().id}/active.json`);

  openManifestMock(): void {
    window.open(this.manifestUrl(), '_blank');
  }

  openPortalDemo(): void {
    const tenant = this.tenantService.activeTenantId();
    const campaignId = this.campaignService.activeCampaign().id;
    window.open(`${this.config.portalDemoUrl}/?tenant=${encodeURIComponent(tenant)}&campaign=${encodeURIComponent(campaignId)}`, '_blank');
  }
}
