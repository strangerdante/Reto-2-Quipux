import { Component, OnInit, inject, input } from '@angular/core';
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
  `]
})
export class EditorComponent implements OnInit {
  readonly campaignService = inject(CampaignService);
  readonly publishService = inject(PublishService);
  private readonly router = inject(Router);

  // Input binding for route param :id
  readonly id = input<string>();

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
}
