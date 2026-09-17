import { Component, inject } from '@angular/core';
import { CampaignService } from '@core/services/campaign.service';
import { PopupLayout } from '@core/models/campaign.model';

@Component({
  selector: 'app-layout-picker',
  imports: [],
  template: `
    <span class="field-label">Disposición del contenido</span>
    <div class="layout-options">
      <button
        [class.active]="campaignService.activeCampaign().layout === 'side'"
        (click)="campaignService.setLayout('side')"
      >
        <span class="layout-mini side"><i aria-hidden="true"></i><b aria-hidden="true"></b></span>
        Lateral
      </button>

      <button
        [class.active]="campaignService.activeCampaign().layout === 'top'"
        (click)="campaignService.setLayout('top')"
      >
        <span class="layout-mini top"><i aria-hidden="true"></i><b aria-hidden="true"></b></span>
        Superior
      </button>

      <button
        [class.active]="campaignService.activeCampaign().layout === 'content'"
        (click)="campaignService.setLayout('content')"
      >
        <span class="layout-mini content"><b aria-hidden="true"></b></span>
        Solo texto
      </button>
    </div>
  `,
  styles: [`
    .field-label {
      color: var(--ink);
      margin-bottom: 8px;
      font-size: 11px;
      font-weight: 800;
      display: block;
    }

    .layout-options {
      grid-template-columns: repeat(3, 1fr);
      gap: 9px;
      margin-bottom: 20px;
      display: grid;

      button {
        border: 1px solid var(--line);
        color: #706b74;
        background: #fff;
        gap: 7px;
        min-width: 0;
        padding: 9px;
        font-size: 10px;
        font-weight: 700;
        display: grid;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          border-color: rgba(46, 19, 245, 0.3);
        }

        &.active {
          border-color: var(--blue);
          box-shadow: inset 0 -2px var(--blue);
          color: var(--blue);
          font-weight: 900;
        }
      }
    }

    .layout-mini {
      background: #f2f1f4;
      gap: 4px;
      height: 50px;
      padding: 5px;
      display: grid;
      border-radius: 4px;

      &.side {
        grid-template-columns: 42% 1fr;
      }
      &.top {
        grid-template-rows: 42% 1fr;
      }
      &.content {
        grid-template-columns: 1fr;
      }

      i {
        background: var(--sky);
        border-radius: 2px;
      }

      b {
        border: 1px solid var(--line);
        background: #fff;
        border-radius: 2px;
      }
    }

    @media (width <= 620px) {
      .layout-options {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LayoutPickerComponent {
  readonly campaignService = inject(CampaignService);
}
