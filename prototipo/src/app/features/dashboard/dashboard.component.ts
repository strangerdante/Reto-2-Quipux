import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CampaignService } from '@core/services/campaign.service';
import { ResourceService } from '@core/services/resource.service';
import { TenantService } from '@core/services/tenant.service';
import { Campaign } from '@core/models/campaign.model';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, LucideAngularModule],
  template: `
    <div class="page-content">
      <div class="page-heading">
        <div>
          <span class="eyebrow">BIBLIOTECA DE COMPONENTES</span>
          <h1>Campañas y modales activos</h1>
          <p>
            Administra popups, modales con sliders y variantes informativas por portal.
            Gobernanza centralizada sin tocar el contenedor de GTM en cada campaña.
          </p>
        </div>
        <button class="q-button primary" (click)="onCreateNew()">
          <lucide-icon name="plus" [size]="15"></lucide-icon> Nuevo componente
        </button>
      </div>

      <!-- Resumen rápido métricas -->
      <section class="summary-grid" aria-label="Métricas del portal">
        <article>
          <span class="summary-icon ink"><lucide-icon name="layers" [size]="18"></lucide-icon></span>
          <div>
            <small>Total en catálogo</small>
            <strong>{{ campaignService.campaigns().length }}</strong>
          </div>
          <em>{{ activeWithSliderCount() }} con slider</em>
        </article>

        <article>
          <span class="summary-icon green"><lucide-icon name="check-circle-2" [size]="18"></lucide-icon></span>
          <div>
            <small>Activos hoy</small>
            <strong>{{ publishedCount() }}</strong>
          </div>
          <em>{{ tenantService.activeTenant().name }}</em>
        </article>

        <article>
          <span class="summary-icon orange"><lucide-icon name="folder" [size]="18"></lucide-icon></span>
          <div>
            <small>CDN Storage</small>
            <strong>{{ resourceService.totalStorageFormatted() }}</strong>
          </div>
          <em>resources/tenants/{{ tenantService.activeTenantId() }}/</em>
        </article>

        <article>
          <span class="summary-icon purple"><lucide-icon name="rocket" [size]="18"></lucide-icon></span>
          <div>
            <small>Versión activa</small>
            <strong>{{ latestPublishedVersion() }}</strong>
          </div>
          <em>ID: {{ activeCampaignId() }}</em>
        </article>
      </section>

      <!-- Plantillas disponibles -->
      <section class="template-section">
        <div class="section-title">
          <div>
            <h2>Crear desde plantilla</h2>
            <small>Componentes pre-diseñados bajo la línea gráfica Quipux 2026</small>
          </div>
        </div>

        <div class="template-grid">
          <button class="template-card featured" (click)="onCreateNew()">
            <div class="template-visual modal-icon">
              <lucide-icon name="images" [size]="22"></lucide-icon>
            </div>
            <span>
              <strong>Modal con slider</strong>
              <small>De 2 a 5 slides, responsive desktop/mobile y reglas de aparición.</small>
            </span>
            <em>Recomendado</em>
          </button>

          <button class="template-card" (click)="onCreateBanner()">
            <div class="template-visual banner-icon">
              <lucide-icon name="megaphone" [size]="22"></lucide-icon>
            </div>
            <span>
              <strong>Banner horizontal (AP-05)</strong>
              <small>Fila superior gobernada para avisos institucionales y alertas viales.</small>
            </span>
            <em style="background: var(--blue); color: #fff;">Disponible</em>
          </button>

          <button class="template-card upcoming" disabled>
            <div class="template-visual alert-icon">
              <lucide-icon name="alert-triangle" [size]="22"></lucide-icon>
            </div>
            <span>
              <strong>Alerta fija inferior</strong>
              <small>Llamado persistente para emergencias o cierres programados.</small>
            </span>
            <em>Próximo</em>
          </button>

          <button class="template-card upcoming" disabled>
            <div class="template-visual survey-icon">
              <lucide-icon name="star" [size]="22"></lucide-icon>
            </div>
            <span>
              <strong>Encuesta rápida</strong>
              <small>Microformulario de satisfacción de trámites en 2 pasos.</small>
            </span>
            <em>Próximo</em>
          </button>
        </div>
      </section>

      <!-- Listado de componentes -->
      <section class="list-card">
        <div class="list-toolbar">
          <div>
            <h2>Todos los componentes</h2>
            <span>{{ campaignService.filteredCampaigns().length }} elementos en lista</span>
          </div>

          <div class="search-box">
            <span aria-hidden="true"><lucide-icon name="search" [size]="14"></lucide-icon></span>
            <input
              type="search"
              placeholder="Buscar por nombre o tenant..."
              [value]="campaignService.filterQuery()"
              (input)="onSearchInput($event)"
              aria-label="Filtrar componentes"
            />
          </div>
        </div>

        <div class="component-table" role="region" aria-label="Tabla de componentes">
          <div class="table-head">
            <span>COMPONENTE</span>
            <span>TENANT ASOCIADO</span>
            <span>TIPO</span>
            <span>ESTADO</span>
            <span>VERSIÓN</span>
            <span style="text-align: right;">ACCIONES</span>
          </div>

          @for (comp of campaignService.filteredCampaigns(); track comp.id) {
            <div class="table-row">
              <div class="component-cell">
                <span class="mini-component" aria-hidden="true"><lucide-icon name="layers" [size]="16"></lucide-icon></span>
                <span>
                  <strong>{{ comp.name }}</strong>
                  <small>Actualizado: {{ comp.updated }}</small>
                </span>
              </div>

              <span>{{ comp.tenant }}</span>
              <span>{{ comp.type }}</span>

              <span>
                <span class="status" [class]="getDisplayStatus(comp).cssClass">
                  <i></i>{{ getDisplayStatus(comp).label }}
                </span>
              </span>

              <span><code>{{ comp.version }}</code></span>

              <div style="text-align: right; display: inline-flex; align-items: center; justify-content: flex-end; gap: 6px;">
                @if (comp.status === 'Publicado') {
                  <button
                    class="row-action pause-btn"
                    [disabled]="!canToggleStatus()"
                    [title]="canToggleStatus() ? 'Pausar campaña en vivo (Kill Switch)' : 'Solo usuarios con rol Publicador o Revisor pueden pausar campañas'"
                    (click)="openPauseModal(comp)"
                    style="display: inline-flex; align-items: center; gap: 4px;"
                  >
                    <lucide-icon name="pause-circle" [size]="13"></lucide-icon> Pausar
                  </button>
                } @else if (comp.status === 'Inactivo') {
                  <button
                    class="row-action resume-btn"
                    [disabled]="!canToggleStatus()"
                    [title]="canToggleStatus() ? 'Reactivar campaña en vivo' : 'Solo usuarios con rol Publicador o Revisor pueden reactivar campañas'"
                    (click)="onReactivateCampaign(comp.id)"
                    style="display: inline-flex; align-items: center; gap: 4px;"
                  >
                    <lucide-icon name="play-circle" [size]="13"></lucide-icon> Reactivar
                  </button>
                }

                <button class="row-action" (click)="onEditCampaign(comp.id)" style="display: inline-flex; align-items: center; gap: 4px;">
                  Editar <lucide-icon name="arrow-right" [size]="12"></lucide-icon>
                </button>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Banner cargador GTM -->
      <section class="loader-banner">
        <div class="loader-brand">
          <img src="brand/isologo.png" alt="Quipux" />
          <span>
            <small>Integración de portal</small>
            <strong>Cargador estático Quipux GTM activo</strong>
          </span>
        </div>

        <div class="loader-flow">
          <span>GTM Workspace</span>
          <i>→</i>
          <span>Cargador idempotente</span>
          <i>→</i>
          <span>CDN Multitenant</span>
          <i>→</i>
          <span>Modal render</span>
        </div>

        <button routerLink="/integration">Ver snippet ↗</button>
      </section>

      <!-- Modal de confirmación para pausar campaña en vivo (Kill Switch) -->
      @if (pendingPauseCampaign(); as target) {
        <div class="pause-modal-backdrop" (click)="closePauseModal()">
          <div class="pause-modal-card" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="pause-title">
            <div class="pause-modal-header">
              <div class="pause-modal-icon">
                <lucide-icon name="alert-triangle" [size]="20"></lucide-icon>
              </div>
              <div>
                <h3 id="pause-title">¿Pausar campaña en vivo?</h3>
                <p>La campaña <strong>"{{ target.name }}"</strong> dejará de mostrarse en el portal inmediatamente sin modificar el contenedor GTM.</p>
              </div>
            </div>

            <div class="pause-modal-details">
              <div class="pause-detail-row">
                <span>Ruta afectada:</span>
                <code>{{ target.rules.pathRule || '*' }}</code>
              </div>
              <div class="pause-detail-row">
                <span>Tenant:</span>
                <span>{{ target.tenant }}</span>
              </div>
              <div class="pause-detail-row">
                <span>Efecto en CDN:</span>
                <span class="warning-text"><code>active.json</code> se actualizará a Inactivo (active: false).</span>
              </div>
            </div>

            <div class="pause-modal-actions">
              <button type="button" class="q-button secondary" (click)="closePauseModal()">Cancelar</button>
              <button type="button" class="q-button danger-btn" (click)="confirmPause()">
                <lucide-icon name="pause-circle" [size]="14"></lucide-icon> Confirmar y pausar en vivo
              </button>
            </div>
          </div>
        </div>
      }
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

    .summary-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 34px;
      display: grid;

      article {
        border: 1px solid var(--line);
        background: #fff;
        grid-template-columns: 38px 1fr auto;
        align-items: center;
        gap: 11px;
        min-width: 0;
        padding: 17px 18px;
        display: grid;
        border-radius: 8px;

        div {
          display: grid;
        }

        small {
          color: var(--sub);
          font-size: 9px;
          font-weight: 700;
        }

        strong {
          color: var(--ink);
          font-size: 24px;
          font-weight: 900;
          line-height: 1.05;
        }

        em {
          color: #8c8791;
          text-align: right;
          font-size: 8.5px;
          font-style: normal;
        }
      }
    }

    .summary-icon {
      place-items: center;
      width: 38px;
      height: 38px;
      font-size: 15px;
      font-weight: 900;
      display: grid;
      border-radius: 6px;

      &.ink {
        color: var(--ink);
        background: rgba(33, 28, 51, 0.08);
      }
      &.green {
        color: #1f6e48;
        background: rgba(93, 201, 154, 0.18);
      }
      &.orange {
        color: #7a4810;
        background: rgba(242, 163, 65, 0.2);
      }
      &.purple {
        color: var(--purple);
        background: rgba(91, 25, 209, 0.12);
      }
    }

    .template-section {
      margin-bottom: 28px;
    }

    .section-title {
      justify-content: space-between;
      align-items: flex-end;
      gap: 18px;
      margin-bottom: 13px;
      display: flex;

      h2 {
        color: var(--ink);
        letter-spacing: -0.02em;
        margin: 0;
        font-size: 18px;
        font-weight: 900;
      }

      small {
        color: #87838c;
        font-size: 10px;
      }
    }

    .template-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      display: grid;
    }

    .template-card {
      border: 1px solid var(--line);
      text-align: left;
      background: #fff;
      grid-template-columns: 48px 1fr;
      align-items: center;
      gap: 12px;
      min-height: 126px;
      padding: 15px;
      display: grid;
      position: relative;
      overflow: hidden;
      border-radius: 8px;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        border-color: rgba(46, 19, 245, 0.35);
        box-shadow: 0 8px 22px rgba(33, 28, 51, 0.07);
      }

      &.featured {
        border-top: 3px solid var(--blue);
      }

      &.upcoming {
        opacity: 0.72;
        cursor: not-allowed;
      }

      > span:nth-child(2) {
        gap: 4px;
        display: grid;

        strong {
          color: var(--ink);
          font-size: 12px;
        }

        small {
          color: #85808a;
          font-size: 9.5px;
          line-height: 1.35;
        }
      }

      em {
        background: var(--cool);
        color: #27646a;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 3px 6px;
        font: 700 7px/1.2 ui-monospace, monospace;
        position: absolute;
        top: 8px;
        right: 9px;
        border-radius: 4px;
      }

      &.upcoming em {
        color: #817c86;
        background: #f1f0f3;
      }
    }

    .template-visual {
      background: var(--cool);
      width: 48px;
      height: 48px;
      color: var(--blue);
      place-items: center;
      font-weight: 900;
      display: grid;
      position: relative;
      border-radius: 6px;

      &.modal-icon {
        i {
          border: 2px solid var(--blue);
          width: 34px;
          height: 26px;
          position: absolute;
          border-radius: 2px;
        }
        b {
          background: var(--sky);
          width: 12px;
          height: 15px;
          position: absolute;
          left: 9px;
        }
      }

      &.banner-icon i {
        border: 2px solid var(--purple);
        background: rgba(91, 25, 209, 0.1);
        width: 34px;
        height: 12px;
      }

      &.alert-icon {
        color: var(--orange);
        font-size: 20px;
      }

      &.survey-icon {
        color: var(--purple);
        font-size: 20px;
      }
    }

    .list-card {
      border: 1px solid var(--line);
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
    }

    .list-toolbar {
      border-bottom: 1px solid var(--line);
      justify-content: space-between;
      align-items: center;
      gap: 18px;
      min-height: 71px;
      padding: 14px 18px;
      display: flex;

      > div {
        gap: 3px;
        display: grid;

        h2 {
          color: var(--ink);
          letter-spacing: -0.02em;
          margin: 0;
          font-size: 18px;
          font-weight: 900;
        }

        span {
          color: #87838c;
          font-size: 10px;
        }
      }
    }

    .search-box {
      border: 1px solid var(--line);
      background: #fbfbfc;
      border-radius: 7px;
      grid-template-columns: 27px 1fr;
      align-items: center;
      min-width: 270px;
      height: 36px;
      display: grid;
      padding: 0 8px;

      span {
        text-align: center;
        color: var(--sub);
        font-size: 12px;
      }

      input {
        background: transparent;
        border: 0;
        outline: 0;
        min-width: 0;
        height: 100%;
        font-size: 10px;
      }
    }

    .component-table {
      overflow-x: auto;
    }

    .table-head, .table-row {
      grid-template-columns: minmax(240px, 1.5fr) minmax(150px, 1fr) 110px 85px 90px 90px;
      align-items: center;
      gap: 12px;
      min-width: 850px;
      display: grid;
    }

    .table-head {
      color: #928d97;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      background: #fafafb;
      min-height: 38px;
      padding: 0 18px;
      font: 700 8.5px/1 ui-monospace, monospace;
    }

    .table-row {
      border-top: 1px solid var(--line-soft);
      color: #5f5b63;
      min-height: 64px;
      padding: 8px 18px;
      font-size: 11px;
      transition: background 0.15s ease;

      &:hover {
        background: #fcfcfd;
      }

      code {
        color: #65606a;
        background: #f4f3f6;
        border-radius: 4px;
        padding: 4px 6px;
        font-size: 9.5px;
      }
    }

    .component-cell {
      grid-template-columns: 34px 1fr;
      align-items: center;
      gap: 10px;
      display: grid;

      > span {
        gap: 3px;
        display: grid;

        strong {
          color: var(--ink);
          font-size: 12px;
          font-weight: 800;
        }

        small {
          color: #8f8a94;
          font-size: 9.5px;
        }
      }
    }

    .mini-component {
      background: var(--cool);
      width: 34px;
      height: 34px;
      color: var(--blue);
      place-items: center;
      font-size: 14px;
      display: grid;
      border-radius: 6px;
    }

    .row-action {
      color: var(--blue);
      background: transparent;
      border: 0;
      font-size: 10px;
      font-weight: 900;
      padding: 6px 10px;
      border-radius: 6px;

      &:hover {
        background: rgba(46, 19, 245, 0.08);
      }

      &.pause-btn {
        color: #d97706;
        &:hover:not(:disabled) {
          background: rgba(217, 119, 6, 0.1);
        }
      }

      &.resume-btn {
        color: #059669;
        &:hover:not(:disabled) {
          background: rgba(5, 150, 105, 0.1);
        }
      }

      &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
    }

    .pause-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(3px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: fadeIn 0.15s ease-out;
    }

    .pause-modal-card {
      background: #ffffff;
      border-radius: 12px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      border: 1px solid var(--line);
      overflow: hidden;
      animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .pause-modal-header {
      display: flex;
      gap: 14px;
      padding: 22px 24px 16px;
      align-items: flex-start;

      h3 {
        margin: 0 0 6px;
        font-size: 16px;
        font-weight: 800;
        color: var(--ink);
      }

      p {
        margin: 0;
        font-size: 12.5px;
        color: #64748b;
        line-height: 1.45;
      }
    }

    .pause-modal-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #fef3c7;
      color: #d97706;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .pause-modal-details {
      background: #f8fafc;
      margin: 0 24px;
      padding: 12px 14px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 11.5px;
    }

    .pause-detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      span:first-child {
        color: #64748b;
        font-weight: 600;
      }

      code {
        background: #e2e8f0;
        color: #0f172a;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10.5px;
      }

      .warning-text {
        color: #b45309;
        font-size: 11px;
        text-align: right;
      }
    }

    .pause-modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 24px;
      border-top: 1px solid var(--line-soft);
      margin-top: 18px;
      background: #fff;
    }

    .danger-btn {
      background: #dc2626 !important;
      color: #fff !important;
      border-color: #dc2626 !important;

      &:hover {
        background: #b91c1c !important;
      }
    }

    .loader-banner {
      background: var(--ink);
      color: #fff;
      grid-template-columns: 1fr auto auto;
      align-items: center;
      gap: 26px;
      min-height: 66px;
      margin-top: 18px;
      padding: 14px 20px;
      display: grid;
      border-radius: 8px;

      button {
        color: #fff;
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.24);
        padding: 8px 14px;
        font-size: 10px;
        font-weight: 800;
        border-radius: 6px;
        cursor: pointer;

        &:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      }
    }

    .loader-brand {
      align-items: center;
      gap: 12px;
      display: flex;

      img {
        width: 32px;
        height: 32px;
      }

      > span {
        gap: 2px;
        display: grid;

        small {
          color: rgba(255, 255, 255, 0.48);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font: 600 7.5px/1.2 ui-monospace, monospace;
        }

        strong {
          font-size: 12px;
        }
      }
    }

    .loader-flow {
      color: var(--sky);
      align-items: center;
      gap: 10px;
      display: flex;

      span {
        border: 1px solid rgba(97, 199, 208, 0.25);
        padding: 6px 9px;
        font-size: 9px;
        font-weight: 800;
        border-radius: 4px;
      }

      i {
        color: rgba(255, 255, 255, 0.32);
        font-style: normal;
      }
    }

    @media (width <= 1180px) {
      .summary-grid, .template-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (width <= 620px) {
      .page-heading {
        flex-direction: column;
        gap: 16px;
      }
      .summary-grid, .template-grid {
        grid-template-columns: 1fr;
      }
      .section-title, .list-toolbar {
        flex-direction: column;
        align-items: flex-start;
      }
      .search-box {
        min-width: 100%;
      }
      .loader-banner {
        grid-template-columns: 1fr;
      }
      .loader-flow {
        flex-wrap: wrap;
      }
    }
  `]
})
export class DashboardComponent {
  readonly campaignService = inject(CampaignService);
  readonly resourceService = inject(ResourceService);
  readonly tenantService = inject(TenantService);
  private readonly router = inject(Router);

  activeWithSliderCount(): number {
    return this.campaignService.campaigns().filter(c => c.type === 'Modal con slider').length;
  }

  publishedCount(): number {
    const now = Date.now();
    return this.campaignService.campaigns().filter(c => {
      if (c.status !== 'Publicado') return false;
      const start = c.rules?.startDate ? new Date(c.rules.startDate).getTime() : 0;
      const end = c.rules?.endDate ? new Date(c.rules.endDate).getTime() : Infinity;
      if (start && !isNaN(start) && now < start) return false;
      if (end && !isNaN(end) && now > end) return false;
      return true;
    }).length;
  }

  getDisplayStatus(comp: Campaign): { label: string; cssClass: string } {
    if (comp.status !== 'Publicado') {
      const normalized = comp.status.toLowerCase().replace(/\s+/g, '-');
      return { label: comp.status, cssClass: normalized };
    }
    const now = Date.now();
    const start = comp.rules?.startDate ? new Date(comp.rules.startDate).getTime() : 0;
    const end = comp.rules?.endDate ? new Date(comp.rules.endDate).getTime() : Infinity;

    if (start && !isNaN(start) && now < start) {
      return { label: 'Programado', cssClass: 'programado' };
    }
    if (end && !isNaN(end) && now > end) {
      return { label: 'Expirado', cssClass: 'expirado' };
    }
    return { label: 'Publicado', cssClass: 'publicado' };
  }

  latestPublishedVersion(): string {
    const pub = this.campaignService.campaigns().find(c => c.status === 'Publicado');
    return pub ? pub.version : 'v1';
  }

  activeCampaignId(): string {
    const pub = this.campaignService.campaigns().find(c => c.status === 'Publicado');
    return pub ? pub.id : (this.campaignService.campaigns()[0]?.id || 'Sin campañas');
  }

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.campaignService.setFilterQuery(val);
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  onEditCampaign(id: string): void {
    this.campaignService.loadCampaign(id);
    this.router.navigate(['/editor', id]);
  }

  onCreateNew(): void {
    const newCamp = this.campaignService.createNewCampaign();
    this.router.navigate(['/editor', newCamp.id]);
  }

  onCreateBanner(): void {
    const newCamp = this.campaignService.createNewCampaign('Modal informativo', 'top');
    this.router.navigate(['/editor', newCamp.id]);
  }

  readonly pendingPauseCampaign = signal<Campaign | null>(null);

  canToggleStatus(): boolean {
    const role = this.tenantService.activeRole();
    return role === 'Publicador' || role === 'Revisor';
  }

  openPauseModal(comp: Campaign): void {
    if (!this.canToggleStatus()) return;
    this.pendingPauseCampaign.set(comp);
  }

  closePauseModal(): void {
    this.pendingPauseCampaign.set(null);
  }

  confirmPause(): void {
    const target = this.pendingPauseCampaign();
    if (target) {
      this.campaignService.pauseCampaign(target.id, () => {
        this.closePauseModal();
      });
    }
  }

  onReactivateCampaign(campaignId: string): void {
    if (!this.canToggleStatus()) return;
    this.campaignService.reactivateCampaign(campaignId);
  }
}
