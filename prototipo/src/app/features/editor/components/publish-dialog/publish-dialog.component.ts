import { Component, computed, inject, signal } from '@angular/core';
import { CampaignService } from '@core/services/campaign.service';
import { PublishService } from '@core/services/publish.service';
import { ResourceService } from '@core/services/resource.service';
import { TenantService } from '@core/services/tenant.service';
import { APP_CONFIG } from '@core/config/app-config';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-publish-dialog',
  imports: [LucideAngularModule],
  template: `
    @if (publishService.isPublishOpen()) {
      <div class="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div class="publish-dialog">
          <header>
            <div>
              <h2 id="dialog-title">Confirmar publicación en CDN</h2>
              <p>
                Se generará una versión inmutable para el portal <strong>{{ tenantService.activeTenant().name }}</strong>
                sin requerir cambios manuales en Google Tag Manager.
              </p>
            </div>
            <button (click)="publishService.closePublishDialog()" aria-label="Cerrar diálogo">
              <lucide-icon name="x" [size]="16"></lucide-icon>
            </button>
          </header>

          <div class="publish-summary">
            <div>
              <span>COMPONENTE</span>
              <strong>{{ campaignService.activeCampaign().name }}</strong>
            </div>
            <div>
              <span>TENANT DESTINO</span>
              <code>{{ tenantService.activeTenantId() }}</code>
            </div>
            <div>
              <span>VERSIÓN A EMITIR</span>
              <strong>{{ nextVersionTag() }} (Inmutable)</strong>
            </div>
          </div>

          <div class="publish-path">
            <span>DESTINO INMUTABLE DEL MANIFEST ACTIVO</span>
            <code>{{ manifestUrl() }}</code>
          </div>

          <!-- Selector de Pestaña: Preflight vs Comparador Diff (AP-03) -->
          <div class="dialog-tabs">
            <button
              [class.active]="activeTab() === 'preflight'"
              (click)="activeTab.set('preflight')"
              type="button"
            >
              <lucide-icon name="shield-check" [size]="14"></lucide-icon>
              Preflight Checks ({{ passedChecksCount() }}/{{ publishService.preflightChecks().length }})
            </button>
            <button
              [class.active]="activeTab() === 'diff'"
              (click)="activeTab.set('diff')"
              type="button"
            >
              <lucide-icon name="git-compare" [size]="14"></lucide-icon>
              Comparador de Versiones (AP-03)
            </button>
          </div>

          @if (activeTab() === 'preflight') {
            <!-- Alerta interactiva de conflicto si existe solapamiento de rutas -->
            @if (publishService.conflictWarning(); as conflict) {
              @if (conflict.hasConflict && !publishService.conflictDismissed()) {
                <div class="conflict-dialog-alert" role="alert">
                  <div class="conflict-header">
                    <span class="conflict-badge">
                      <lucide-icon name="alert-triangle" [size]="13"></lucide-icon> ADVERTENCIA DE SOLAPAMIENTO
                    </span>
                    <code>{{ conflict.conflictingCampaign?.rules?.pathRule }}</code>
                  </div>
                  <p>
                    ⚠️ <strong>Advertencia:</strong> Ya existe la campaña activa 
                    <strong>'{{ conflict.conflictingCampaign?.name }}'</strong> programada para la ruta 
                    <code>{{ conflict.conflictingCampaign?.rules?.pathRule }}</code> en el mismo rango de fechas. 
                    ¿Deseas pausar la anterior o continuar?
                  </p>
                  <div class="conflict-actions">
                    <button
                      class="btn-pause"
                      (click)="publishService.pauseConflictingCampaign(conflict.conflictingCampaign?.id!)"
                      type="button"
                    >
                      <lucide-icon name="pause-circle" [size]="13"></lucide-icon> Pausar la anterior
                    </button>
                    <button
                      class="btn-continue"
                      (click)="publishService.dismissConflict()"
                      type="button"
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              }
            }

            <div class="publish-checks">
              @for (chk of publishService.preflightChecks(); track chk.id) {
                <div [class.failed]="!chk.passed">
                  <span [class.fail-icon]="!chk.passed">
                    <lucide-icon [name]="chk.passed ? 'check' : 'alert-triangle'" [size]="12"></lucide-icon>
                  </span>
                  <p>
                    <strong>{{ chk.label }}</strong>
                    <small>{{ chk.detail }}</small>
                  </p>
                </div>
              }
            </div>
          } @else {
            <div class="diff-viewer">
              <div class="diff-header">
                <span>CAMPO</span>
                <span>VERSIÓN ANTERIOR</span>
                <span>NUEVA VERSIÓN</span>
              </div>
              <div class="diff-body">
                @for (item of publishService.versionDiff(); track item.field) {
                  <div class="diff-row" [class]="item.type">
                    <strong>{{ item.field }}</strong>
                    <div class="diff-val before">{{ item.before }}</div>
                    <div class="diff-val after">{{ item.after }}</div>
                  </div>
                }
              </div>
            </div>
          }

          @if (!publishService.canPublish()) {
            <div class="role-warning">
              <lucide-icon name="alert-triangle" [size]="14"></lucide-icon>
              <p>
                <strong>Restricción de rol (AP-01):</strong> El usuario actual tiene rol
                <strong>{{ tenantService.activeRole() }}</strong>. Solo usuarios con rol
                <strong>Publicador</strong> pueden emitir versiones a producción.
              </p>
            </div>
          }

          @if (campaignService.activeCampaign().status === 'Borrador' || campaignService.activeCampaign().status === 'En revisión') {
            <div class="role-warning" style="background: #fffbeb; border-color: #fde68a; color: #92400e;">
              <lucide-icon name="alert-triangle" [size]="14"></lucide-icon>
              <p>
                <strong>Gobernanza de aprobación (AP-01):</strong> La campaña está en estado <strong>{{ campaignService.activeCampaign().status }}</strong>. La publicación por rol Publicador la promoverá a <strong>Publicado</strong>.
              </p>
            </div>
          }

          <div class="publish-warning">
            <span aria-hidden="true"><lucide-icon name="rocket" [size]="14"></lucide-icon></span>
            <p>
              <strong>Cargador de GTM en producción (AC-12)</strong>
              El portal cliente detectará la versión activa automáticamente sin editar etiquetas en GTM.
            </p>
          </div>

          <footer>
            <button class="q-button secondary" (click)="publishService.closePublishDialog()">
              Cancelar
            </button>
            <button
              class="q-button primary"
              [disabled]="publishService.isPublishing() || !publishService.canPublish() || !allChecksPassed()"
              (click)="publishService.confirmPublish()"
            >
              @if (publishService.isPublishing()) {
                Compilando release...
              } @else {
                Confirmar y publicar ahora
              }
            </button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    .dialog-backdrop {
      z-index: 90;
      backdrop-filter: blur(4px);
      background: rgba(20, 16, 31, 0.76);
      place-items: center;
      padding: 22px;
      display: grid;
      position: fixed;
      inset: 0;
      animation: fadeIn 0.15s ease-out;
    }

    .publish-dialog {
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 12px;
      width: 100%;
      max-width: 580px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

      header {
        border-bottom: 1px solid var(--line-soft);
        justify-content: space-between;
        align-items: flex-start;
        padding: 24px 24px 18px;
        display: flex;

        h2 {
          color: var(--ink);
          margin: 0 0 6px;
          font-size: 18px;
          font-weight: 800;
        }

        p {
          color: var(--sub);
          margin: 0;
          font-size: 12px;
          line-height: 1.4;
        }

        button {
          background: transparent;
          border: 0;
          color: var(--sub);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;

          &:hover {
            color: var(--ink);
            background: #f1f3f5;
          }
        }
      }
    }

    .publish-summary {
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      padding: 16px 24px;
      background: #fafafa;
      border-bottom: 1px solid var(--line-soft);
      display: grid;

      div {
        display: flex;
        flex-direction: column;
        gap: 3px;

        span {
          color: var(--sub);
          font: 700 8.5px/1 ui-monospace, monospace;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        strong {
          color: var(--ink);
          font-size: 12px;
          font-weight: 800;
        }

        code {
          color: var(--blue);
          font-size: 11px;
          font-weight: 700;
        }
      }
    }

    .publish-path {
      padding: 12px 24px;
      border-bottom: 1px solid var(--line-soft);
      display: flex;
      flex-direction: column;
      gap: 4px;

      span {
        color: var(--sub);
        font: 700 8.5px/1 ui-monospace, monospace;
        letter-spacing: 0.08em;
      }

      code {
        color: var(--quipux-ink, #211C33);
        background: #f1f3f5;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        word-break: break-all;
      }
    }

    .dialog-tabs {
      display: flex;
      border-bottom: 1px solid var(--line-soft);
      padding: 0 24px;
      gap: 12px;
      background: #fcfcfc;

      button {
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        padding: 10px 4px;
        font-size: 12px;
        font-weight: 700;
        color: var(--sub);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;

        &.active {
          color: var(--blue);
          border-bottom-color: var(--blue);
        }
      }
    }

    .conflict-dialog-alert {
      margin: 14px 24px 0;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-left: 4px solid #f59e0b;
      border-radius: 8px;
      padding: 12px 16px;

      .conflict-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;

        .conflict-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #b45309;
          font-size: 10px;
          font-weight: 800;
        }

        code {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fcd34d;
          padding: 1px 5px;
          border-radius: 3px;
          font-size: 10.5px;
          font-family: ui-monospace, monospace;
        }
      }

      p {
        color: #78350f;
        font-size: 11.5px;
        line-height: 1.45;
        margin: 0 0 10px;

        strong {
          color: #451a03;
        }

        code {
          background: rgba(0, 0, 0, 0.05);
          padding: 1px 4px;
          border-radius: 3px;
        }
      }

      .conflict-actions {
        display: flex;
        gap: 8px;

        button {
          padding: 5px 10px;
          border-radius: 5px;
          font-size: 10.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .btn-pause {
          background: #d97706;
          color: #fff;
          border: 1px solid #b45309;

          &:hover {
            background: #b45309;
          }
        }

        .btn-continue {
          background: #fff;
          color: #92400e;
          border: 1px solid #fcd34d;

          &:hover {
            background: #fef3c7;
          }
        }
      }
    }

    .publish-checks {
      padding: 16px 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;

      > div {
        display: flex;
        align-items: flex-start;
        gap: 10px;

        span {
          background: rgba(93, 201, 154, 0.2);
          color: #166534;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;

          &.fail-icon {
            background: rgba(239, 68, 68, 0.2);
            color: #991b1b;
          }
        }

        p {
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;

          strong {
            color: var(--ink);
            font-size: 12px;
          }

          small {
            color: var(--sub);
            font-size: 11px;
          }
        }
      }
    }

    .diff-viewer {
      padding: 14px 24px;

      .diff-header {
        display: grid;
        grid-template-columns: 140px 1fr 1fr;
        gap: 8px;
        font: 700 9px ui-monospace, monospace;
        color: var(--sub);
        padding-bottom: 8px;
        border-bottom: 1px solid var(--line-soft);
      }

      .diff-body {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: 8px;
        max-height: 180px;
        overflow-y: auto;
      }

      .diff-row {
        display: grid;
        grid-template-columns: 140px 1fr 1fr;
        gap: 8px;
        font-size: 11px;
        align-items: center;
        padding: 4px 6px;
        border-radius: 4px;

        strong {
          color: var(--ink);
        }

        .diff-val {
          padding: 2px 6px;
          border-radius: 3px;
          font-family: ui-monospace, monospace;
          font-size: 10px;

          &.before {
            background: #fef2f2;
            color: #991b1b;
            text-decoration: line-through;
          }

          &.after {
            background: #f0fdf4;
            color: #166534;
            font-weight: 700;
          }
        }
      }
    }

    .role-warning {
      margin: 0 24px 12px;
      padding: 10px 14px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 6px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      color: #92400e;
      font-size: 11.5px;

      p {
        margin: 0;
      }
    }

    .publish-warning {
      margin: 0 24px 16px;
      padding: 12px 14px;
      background: rgba(46, 19, 245, 0.05);
      border: 1px solid rgba(46, 19, 245, 0.15);
      border-radius: 6px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      color: var(--ink);
      font-size: 11.5px;

      span {
        color: var(--blue);
        margin-top: 2px;
      }

      p {
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;

        strong {
          color: var(--blue);
        }
      }
    }

    footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 24px;
      border-top: 1px solid var(--line-soft);
      background: #fafafa;
      border-radius: 0 0 12px 12px;
    }

    .q-button {
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      border: 1px solid var(--line);

      &.secondary {
        background: #fff;
        color: var(--ink);
      }

      &.primary {
        background: var(--blue);
        color: #fff;
        border-color: var(--blue);

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class PublishDialogComponent {
  readonly campaignService = inject(CampaignService);
  readonly tenantService = inject(TenantService);
  readonly publishService = inject(PublishService);
  readonly resourceService = inject(ResourceService);
  private readonly config = inject(APP_CONFIG);

  readonly activeTab = signal<'preflight' | 'diff'>('preflight');

  readonly manifestUrl = computed(() => `${this.config.cdnBaseUrl}/resources/tenants/${this.tenantService.activeTenantId()}/manifests/${this.campaignService.activeCampaign().id}/active.json`);

  readonly nextVersionTag = computed(() => {
    const list = this.publishService.versions();
    let maxV = 0;
    list.forEach(v => {
      const num = parseInt(v.version.replace('v', ''), 10);
      if (!isNaN(num) && num > maxV) maxV = num;
    });
    return `v${maxV + 1}`;
  });

  readonly passedChecksCount = computed(() => {
    return this.publishService.preflightChecks().filter(c => c.passed).length;
  });

  readonly allChecksPassed = computed(() => {
    return this.publishService.preflightChecks().every(c => c.passed);
  });
}
