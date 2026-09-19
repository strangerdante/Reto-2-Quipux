import { Component, OnInit, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CampaignService } from '@core/services/campaign.service';
import { PublishService } from '@core/services/publish.service';
import { LucideAngularModule } from 'lucide-angular';
import { EditorTabsComponent } from './components/editor-tabs/editor-tabs.component';
import { SlideListComponent } from './components/slide-list/slide-list.component';
import { SlideFormComponent } from './components/slide-form/slide-form.component';
import { LayoutPickerComponent } from './components/layout-picker/layout-picker.component';
import { StyleTabComponent } from './components/style-tab/style-tab.component';
import { RulesTabComponent } from './components/rules-tab/rules-tab.component';
import { PublishTabComponent } from './components/publish-tab/publish-tab.component';
import { PreviewCanvasComponent } from './components/preview-canvas/preview-canvas.component';
import { PublishDialogComponent } from './components/publish-dialog/publish-dialog.component';
import { LegacyImporterComponent } from './components/legacy-importer/legacy-importer.component';

@Component({
  selector: 'app-editor',
  imports: [
    EditorTabsComponent,
    SlideListComponent,
    SlideFormComponent,
    LayoutPickerComponent,
    StyleTabComponent,
    RulesTabComponent,
    PublishTabComponent,
    PreviewCanvasComponent,
    PublishDialogComponent,
    LegacyImporterComponent,
    LucideAngularModule
  ],
  template: `
    <div class="editor-view">
      <!-- Barra superior del editor -->
      <header class="editor-header">
        <div class="editor-name">
          <button (click)="goBack()" title="Volver a componentes" aria-label="Volver al catálogo" style="display: flex; align-items: center; justify-content: center;">
            <lucide-icon name="arrow-left" [size]="14"></lucide-icon>
          </button>
          <div>
            <span>EDITANDO COMPONENTE</span>
            <input
              type="text"
              [value]="campaignService.activeCampaign().name"
              (input)="onNameChange($event)"
              placeholder="Nombre de la campaña..."
            />
          </div>
          <span class="status-badge" [class]="getStatusClass(campaignService.activeCampaign().status)">
            {{ campaignService.activeCampaign().status }}
          </span>
        </div>

        <div class="editor-actions">
          <app-legacy-importer></app-legacy-importer>
          <small>{{ campaignService.saveStatus() }}</small>

          @if (campaignService.activeCampaign().status === 'Publicado') {
            <button
              class="q-button"
              style="background: #fff; color: #b45309; border: 1px solid #f59e0b; font-size: 11px; padding: 6px 12px; display: inline-flex; align-items: center; gap: 5px; font-weight: 700;"
              [disabled]="!campaignService.canToggleStatus()"
              [title]="campaignService.canToggleStatus() ? 'Pausar campaña en vivo (Kill Switch)' : 'Solo usuarios con rol Publicador o Revisor pueden pausar la campaña'"
              (click)="openPauseConfirm()"
            >
              <lucide-icon name="pause-circle" [size]="14"></lucide-icon> Pausar en vivo
            </button>
          } @else if (campaignService.activeCampaign().status === 'Inactivo') {
            <button
              class="q-button"
              style="background: #059669; color: #fff; border: 1px solid #059669; font-size: 11px; padding: 6px 12px; display: inline-flex; align-items: center; gap: 5px; font-weight: 700;"
              [disabled]="!campaignService.canToggleStatus()"
              [title]="campaignService.canToggleStatus() ? 'Reactivar campaña en vivo' : 'Solo usuarios con rol Publicador o Revisor pueden reactivar la campaña'"
              (click)="onReactivateCampaign()"
            >
              <lucide-icon name="play-circle" [size]="14"></lucide-icon> Reactivar
            </button>
          }

          <button class="q-button secondary" (click)="campaignService.saveDraft()">
            <lucide-icon name="save" [size]="14"></lucide-icon> Guardar
          </button>
          <button class="q-button primary" (click)="publishService.openPublishDialog()">
            <lucide-icon name="rocket" [size]="14"></lucide-icon> Publicar componente
          </button>
        </div>
      </header>

      <!-- Cuerpo del editor de tres columnas -->
      <div class="editor-body">
        <!-- Columna 1: Pestañas de navegación -->
        <app-editor-tabs />

        <!-- Columna 2: Panel de controles según pestaña -->
        <section class="editor-panel" role="region" aria-label="Controles del editor">
          @switch (campaignService.editorTab()) {
            @case ('content') {
              <app-slide-list />
              <app-slide-form />
              <app-layout-picker />
            }
            @case ('style') {
              <app-style-tab />
            }
            @case ('rules') {
              <app-rules-tab />
            }
            @case ('publish') {
              <app-publish-tab />
            }
          }
        </section>

        <!-- Columna 3: Simulador y lienzo en vivo -->
        <app-preview-canvas />
      </div>

      <!-- Diálogo modal de confirmación de publicación -->
      <app-publish-dialog />

      <!-- Modal de confirmación para pausar campaña en vivo (Kill Switch) -->
      @if (isPauseConfirmOpen()) {
        <div class="pause-modal-backdrop" (click)="closePauseConfirm()">
          <div class="pause-modal-card" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="pause-editor-title">
            <div class="pause-modal-header">
              <div class="pause-modal-icon">
                <lucide-icon name="alert-triangle" [size]="20"></lucide-icon>
              </div>
              <div>
                <h3 id="pause-editor-title">¿Pausar campaña en vivo?</h3>
                <p>La campaña <strong>"{{ campaignService.activeCampaign().name }}"</strong> dejará de mostrarse en el portal inmediatamente sin modificar el contenedor GTM.</p>
              </div>
            </div>

            <div class="pause-modal-details">
              <div class="pause-detail-row">
                <span>Ruta afectada:</span>
                <code>{{ campaignService.activeCampaign().rules.pathRule || '*' }}</code>
              </div>
              <div class="pause-detail-row">
                <span>Tenant:</span>
                <span>{{ campaignService.activeCampaign().tenant }}</span>
              </div>
              <div class="pause-detail-row">
                <span>Efecto en CDN:</span>
                <span class="warning-text"><code>active.json</code> se actualizará a Inactivo (active: false).</span>
              </div>
            </div>

            <div class="pause-modal-actions">
              <button type="button" class="q-button secondary" (click)="closePauseConfirm()">Cancelar</button>
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
    .editor-view {
      background: #f7f7f9;
      height: calc(100vh - 72px);
      min-height: 650px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .editor-header {
      border-bottom: 1px solid var(--line);
      background: #fff;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      height: 82px;
      padding: 0 24px;
      display: flex;
      flex-shrink: 0;
    }

    .editor-name {
      align-items: center;
      gap: 12px;
      min-width: 0;
      display: flex;

      > button {
        border: 1px solid var(--line);
        width: 34px;
        height: 34px;
        color: var(--ink);
        background: #fff;
        flex: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        display: grid;
        place-items: center;
        transition: background 0.15s ease;

        &:hover {
          background: #f5f4f8;
        }
      }

      > div {
        gap: 2px;
        min-width: 0;
        display: grid;

        span {
          color: var(--sub);
          letter-spacing: 0.1em;
          font: 700 8.5px/1.2 ui-monospace, monospace;
        }
      }

      input {
        width: min(410px, 38vw);
        color: var(--ink);
        background: transparent;
        border: 0;
        border-bottom: 1.5px solid transparent;
        outline: 0;
        font-size: 18px;
        font-weight: 900;
        padding: 2px 0;
        transition: border-color 0.15s ease;

        &:focus {
          border-color: var(--blue);
        }
      }
    }

    .status-badge {
      text-transform: uppercase;
      padding: 4px 8px;
      font-size: 8px;
      font-weight: 800;
      border-radius: 4px;
      letter-spacing: 0.08em;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s ease;

      &.borrador {
        color: var(--blue);
        background: rgba(46, 19, 245, 0.08);
      }
      &.en-revision {
        color: #b45309;
        background: rgba(245, 158, 11, 0.16);
      }
      &.aprobado {
        color: #0369a1;
        background: rgba(14, 165, 233, 0.16);
      }
      &.publicado {
        color: #047857;
        background: rgba(16, 185, 129, 0.16);
      }
      &.programado {
        color: #7a4810;
        background: rgba(242, 163, 65, 0.2);
      }
      &.inactivo {
        color: #716c76;
        background: #efedf1;
      }
    }

    .editor-actions {
      align-items: center;
      gap: 10px;
      display: flex;

      > small {
        color: #8d8892;
        margin-right: 6px;
        font-size: 10.5px;
      }
    }

    .editor-body {
      grid-template-columns: 180px minmax(350px, 430px) minmax(520px, 1fr);
      height: calc(100% - 82px);
      display: grid;
      flex: 1;
      overflow: hidden;
    }

    .editor-panel {
      border-right: 1px solid var(--line);
      background: #fff;
      padding: 24px 24px 40px;
      overflow-y: auto;
    }

    @media (width <= 1180px) {
      .editor-body {
        grid-template-columns: 150px 360px minmax(420px, 1fr);
      }
    }

    @media (width <= 900px) {
      .editor-view {
        height: auto;
      }
      .editor-body {
        grid-template-columns: 1fr;
        height: auto;
      }
      .editor-panel {
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }
      .editor-header {
        flex-direction: column;
        align-items: flex-start;
        height: auto;
        min-height: 94px;
        padding: 14px;
      }
      .editor-name input {
        width: 45vw;
        font-size: 15px;
      }
      .editor-name .status-badge,
      .editor-actions > small,
      .editor-actions .secondary {
        display: none;
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
    }

    .pause-modal-card {
      background: #ffffff;
      border-radius: 12px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
      border: 1px solid var(--line);
      overflow: hidden;
    }

    .pause-modal-header {
      display: flex;
      gap: 14px;
      padding: 20px 22px 14px;
      align-items: flex-start;

      h3 {
        margin: 0 0 6px;
        font-size: 15px;
        font-weight: 800;
        color: var(--ink);
      }

      p {
        margin: 0;
        font-size: 12px;
        color: #64748b;
        line-height: 1.45;
      }
    }

    .pause-modal-icon {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: #fef3c7;
      color: #d97706;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .pause-modal-details {
      background: #f8fafc;
      margin: 0 22px;
      padding: 10px 12px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 11px;
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
        font-size: 10px;
      }

      .warning-text {
        color: #b45309;
        font-size: 10.5px;
      }
    }

    .pause-modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 14px 22px;
      border-top: 1px solid var(--line-soft);
      margin-top: 14px;
      background: #f8fafc;
    }

    .danger-btn {
      background: #dc2626 !important;
      color: #fff !important;
      border-color: #dc2626 !important;

      &:hover {
        background: #b91c1c !important;
      }
    }
  `]
})
export class EditorComponent implements OnInit {
  readonly campaignService = inject(CampaignService);
  readonly publishService = inject(PublishService);
  private readonly router = inject(Router);

  // Input binding for route param :id
  readonly id = input<string>();

  readonly isPauseConfirmOpen = signal<boolean>(false);

  ngOnInit(): void {
    const campaignId = this.id();
    if (campaignId) {
      this.campaignService.loadCampaign(campaignId);
    }
  }

  onNameChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.campaignService.updateCampaignName(val);
  }

  getStatusClass(status: string): string {
    const s = (status || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
    return s || 'borrador';
  }

  goBack(): void {
    this.router.navigate(['/components']);
  }

  openPauseConfirm(): void {
    this.isPauseConfirmOpen.set(true);
  }

  closePauseConfirm(): void {
    this.isPauseConfirmOpen.set(false);
  }

  confirmPause(): void {
    const active = this.campaignService.activeCampaign();
    this.campaignService.pauseCampaign(active.id, () => {
      this.closePauseConfirm();
    });
  }

  onReactivateCampaign(): void {
    const active = this.campaignService.activeCampaign();
    this.campaignService.reactivateCampaign(active.id);
  }
}
