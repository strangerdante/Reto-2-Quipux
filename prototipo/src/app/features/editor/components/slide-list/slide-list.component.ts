import { Component, inject } from '@angular/core';
import { CampaignService } from '@core/services/campaign.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-slide-list',
  imports: [LucideAngularModule],
  template: `
    <div class="panel-heading">
      <h2>Slides del modal</h2>
      <button class="mini-button" (click)="campaignService.addSlide()" style="display: inline-flex; align-items: center; gap: 4px;">
        <lucide-icon name="plus" [size]="12"></lucide-icon> Agregar slide
      </button>
    </div>
    <p class="panel-copy">
      Configura cada pantalla del slider. Haz clic en una diapositiva para editar su contenido e imágenes.
    </p>

    <div class="slide-list">
      @for (slide of campaignService.activeCampaign().slides; track slide.id; let idx = $index) {
        <div
          class="slide-row"
          [class.selected]="slide.id === campaignService.selectedSlideId()"
          [class.inactive]="slide.active === false"
          (click)="campaignService.selectSlide(slide.id)"
        >
          <div class="order-controls" (click)="$event.stopPropagation()">
            <button
              class="icon-btn"
              [disabled]="idx === 0"
              (click)="onMoveUp(idx)"
              title="Mover arriba"
            >
              <lucide-icon name="chevron-up" [size]="12"></lucide-icon>
            </button>
            <button
              class="icon-btn"
              [disabled]="idx === campaignService.activeCampaign().slides.length - 1"
              (click)="onMoveDown(idx)"
              title="Mover abajo"
            >
              <lucide-icon name="chevron-down" [size]="12"></lucide-icon>
            </button>
          </div>

          <b>{{ formatIndex(idx + 1) }}</b>
          <span>
            <strong>{{ slide.name }}</strong>
            <small>{{ slide.title }}</small>
          </span>

          <div class="row-actions" (click)="$event.stopPropagation()">
            <button
              class="action-btn"
              (click)="onToggleActive(slide.id)"
              [title]="slide.active !== false ? 'Ocultar slide' : 'Mostrar slide'"
            >
              <lucide-icon [name]="slide.active !== false ? 'eye' : 'eye-off'" [size]="13"></lucide-icon>
            </button>

            <button
              class="action-btn"
              (click)="onDuplicate(slide.id)"
              title="Duplicar slide (AC-03)"
            >
              <lucide-icon name="copy" [size]="13"></lucide-icon>
            </button>

            @if (campaignService.activeCampaign().slides.length > 1) {
              <button
                class="del-btn"
                (click)="onDeleteSlide($event, slide.id)"
                title="Eliminar slide"
              >
                <lucide-icon name="trash-2" [size]="13"></lucide-icon>
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .panel-heading {
      justify-content: space-between;
      align-items: flex-start;
      gap: 15px;
      margin-bottom: 17px;
      display: flex;

      h2 {
        color: var(--ink);
        letter-spacing: -0.025em;
        margin: 0;
        font-size: 20px;
        font-weight: 900;
      }
    }

    .mini-button {
      color: var(--blue);
      background: rgba(46, 19, 245, 0.08);
      border: 1px solid rgba(46, 19, 245, 0.2);
      padding: 7px 11px;
      font-size: 9.5px;
      font-weight: 900;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s ease;

      &:hover {
        background: rgba(46, 19, 245, 0.16);
      }
    }

    .panel-copy {
      color: #7d7882;
      margin: -7px 0 20px;
      font-size: 11px;
      line-height: 1.5;
    }

    .slide-list {
      gap: 7px;
      display: grid;
    }

    .slide-row {
      border: 1px solid var(--line);
      text-align: left;
      background: #fff;
      grid-template-columns: 14px 34px 1fr auto;
      align-items: center;
      gap: 10px;
      width: 100%;
      min-width: 0;
      min-height: 52px;
      padding: 7px 10px;
      display: grid;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: #fafafc;
      }

      &.selected {
        box-shadow: inset 3px 0 var(--blue);
        background: rgba(46, 19, 245, 0.04);
        border-color: rgba(46, 19, 245, 0.42);
      }

      .drag {
        color: #aca7b0;
        letter-spacing: -3px;
        font-size: 12px;
      }

      > b {
        background: var(--ink);
        width: 34px;
        height: 34px;
        color: var(--sky);
        place-items: center;
        font-size: 11px;
        font-family: ui-monospace, monospace;
        display: grid;
        border-radius: 4px;
      }

      > span:nth-child(3) {
        gap: 2px;
        min-width: 0;
        display: grid;

        strong {
          color: var(--ink);
          font-size: 11.5px;
          font-weight: 800;
        }

        small {
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #918c96;
          font-size: 9.5px;
          overflow: hidden;
        }
      }

      .row-actions {
        display: flex;
        align-items: center;
        gap: 8px;

        .action-btn {
          color: var(--sub);
          background: transparent;
          border: 0;
          padding: 4px;
          cursor: pointer;
          border-radius: 4px;
          display: flex;
          align-items: center;

          &:hover {
            color: var(--blue);
            background: rgba(46, 19, 245, 0.06);
          }
        }

        .del-btn {
          color: var(--danger);
          background: transparent;
          border: 0;
          font-size: 11px;
          padding: 4px;
          cursor: pointer;
          opacity: 0.7;

          &:hover {
            opacity: 1;
          }
        }
      }

      &.inactive {
        opacity: 0.55;
        background: #fdfdfd;
        border-style: dashed;
      }
    }

    .order-controls {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .icon-btn {
        background: transparent;
        border: 0;
        padding: 1px;
        cursor: pointer;
        color: var(--sub);
        display: flex;
        align-items: center;
        justify-content: center;

        &:disabled {
          opacity: 0.2;
          cursor: not-allowed;
        }

        &:not(:disabled):hover {
          color: var(--blue);
        }
      }
    }
  `]
})
export class SlideListComponent {
  readonly campaignService = inject(CampaignService);

  formatIndex(num: number): string {
    return String(num).padStart(2, '0');
  }

  onMoveUp(index: number): void {
    if (index > 0) {
      this.campaignService.reorderSlide(index, index - 1);
    }
  }

  onMoveDown(index: number): void {
    if (index < this.campaignService.activeCampaign().slides.length - 1) {
      this.campaignService.reorderSlide(index, index + 1);
    }
  }

  onDuplicate(id: number): void {
    this.campaignService.duplicateSlide(id);
  }

  onToggleActive(id: number): void {
    this.campaignService.toggleSlideActive(id);
  }

  onDeleteSlide(event: Event, id: number): void {
    event.stopPropagation();
    this.campaignService.deleteSlide(id);
  }
}
