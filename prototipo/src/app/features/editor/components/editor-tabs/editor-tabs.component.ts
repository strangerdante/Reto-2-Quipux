import { Component, inject } from '@angular/core';
import { CampaignService } from '@core/services/campaign.service';

@Component({
  selector: 'app-editor-tabs',
  imports: [],
  template: `
    <aside class="editor-tabs">
      <span class="eyebrow">PASOS</span>

      <button
        [class.active]="campaignService.editorTab() === 'content'"
        (click)="campaignService.setEditorTab('content')"
      >
        <span>01</span>
        Contenido
        <i>●</i>
      </button>

      <button
        [class.active]="campaignService.editorTab() === 'style'"
        (click)="campaignService.setEditorTab('style')"
      >
        <span>02</span>
        Estilo
      </button>

      <button
        [class.active]="campaignService.editorTab() === 'rules'"
        (click)="campaignService.setEditorTab('rules')"
      >
        <span>03</span>
        Reglas
      </button>

      <button
        [class.active]="campaignService.editorTab() === 'publish'"
        (click)="campaignService.setEditorTab('publish')"
      >
        <span>04</span>
        Publicación
      </button>

      <div class="component-identity">
        <span>ID DE COMPONENTE</span>
        <code>{{ campaignService.componentSlug() }}</code>
        <small>Modal con slider · {{ campaignService.activeCampaign().slides.length }} slides</small>
      </div>
    </aside>
  `,
  styles: [`
    .editor-tabs {
      border-right: 1px solid var(--line);
      background: #fafafb;
      flex-direction: column;
      padding: 24px 13px 16px;
      display: flex;
      height: 100%;

      .eyebrow {
        color: var(--sub);
        margin-bottom: 12px;
        padding-left: 10px;
        font: 700 8.5px/1.2 ui-monospace, monospace;
      }

      button {
        color: #69646d;
        text-align: left;
        background: transparent;
        border: 0;
        grid-template-columns: 25px 1fr auto;
        align-items: center;
        gap: 8px;
        width: 100%;
        min-height: 43px;
        padding: 8px 10px;
        font-size: 11px;
        font-weight: 800;
        display: grid;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s ease;

        span {
          border: 1px solid var(--line);
          color: #918c96;
          place-items: center;
          width: 24px;
          height: 24px;
          font: 700 8px/1 ui-monospace, monospace;
          display: grid;
          border-radius: 4px;
        }

        i {
          color: var(--blue);
          font-style: normal;
          font-size: 8px;
        }

        &:hover {
          color: var(--ink);
          background: rgba(0, 0, 0, 0.03);
        }

        &.active {
          color: var(--ink);
          box-shadow: inset 3px 0 var(--blue);
          background: #fff;

          span {
            border-color: var(--blue);
            background: var(--blue);
            color: #fff;
          }
        }
      }
    }

    .component-identity {
      background: var(--ink);
      gap: 6px;
      margin-top: auto;
      padding: 12px;
      display: grid;
      border-radius: 6px;

      span {
        color: var(--sky);
        letter-spacing: 0.13em;
        font: 700 8px/1 ui-monospace, monospace;
      }

      code {
        color: #fff;
        font-size: 11px;
        word-break: break-all;
      }

      small {
        color: rgba(255, 255, 255, 0.5);
        font-size: 8.5px;
      }
    }

    @media (width <= 900px) {
      .editor-tabs {
        border-right: 0;
        border-bottom: 1px solid var(--line);
        flex-direction: row;
        padding: 7px;
        overflow-x: auto;
        height: auto;

        .eyebrow, .component-identity {
          display: none;
        }

        button {
          grid-template-columns: 24px 1fr;
          min-width: max-content;

          i {
            display: none;
          }
        }
      }
    }
  `]
})
export class EditorTabsComponent {
  readonly campaignService = inject(CampaignService);
}
