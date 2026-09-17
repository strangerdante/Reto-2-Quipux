import { Component, inject } from '@angular/core';
import { CampaignService } from '@core/services/campaign.service';
import { ResourceService } from '@core/services/resource.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-slide-form',
  imports: [LucideAngularModule],
  template: `
    @if (campaignService.selectedSlide(); as s) {
      <div class="form-divider">
        <span>EDITANDO SLIDE: {{ s.name }}</span>
      </div>

      <label class="field">
        <span>Nombre interno del slide</span>
        <input
          type="text"
          [value]="s.name"
          (input)="onFieldChange('name', $event)"
          placeholder="Ej. Cobro coactivo"
        />
      </label>

      <label class="field">
        <span>Título principal (H2)</span>
        <input
          type="text"
          [value]="s.title"
          (input)="onFieldChange('title', $event)"
          placeholder="Ej. Ponte al día con tus obligaciones"
        />
      </label>

      <label class="field">
        <span>Texto descriptivo</span>
        <textarea
          rows="3"
          [value]="s.description"
          (input)="onFieldChange('description', $event)"
          placeholder="Describe el beneficio o llamado..."
        ></textarea>
      </label>

      <div class="two-fields">
        <label class="field">
          <span>Texto del botón (CTA)</span>
          <input
            type="text"
            [value]="s.cta"
            (input)="onFieldChange('cta', $event)"
            placeholder="Ej. Conocer más"
          />
        </label>

        <label class="field">
          <span>URL de destino (HTTPS)</span>
          <input
            type="url"
            [value]="s.link"
            (input)="onFieldChange('link', $event)"
            placeholder="https://portal.gov.co/..."
          />
        </label>
      </div>

      <label class="field">
        <span>Texto alternativo para accesibilidad (alt)</span>
        <input
          type="text"
          [value]="s.alt"
          (input)="onFieldChange('alt', $event)"
          placeholder="Descripción concisa de la imagen para lectores de pantalla"
        />
      </label>

      <span class="field-label">Imágenes responsive (CDN Multitenant)</span>
      <div class="upload-grid">
        <label class="upload-card">
          <input
            type="file"
            accept="image/webp,image/png,image/jpeg"
            (change)="onFileUpload($event, 'desktop')"
          />
          <b><lucide-icon name="laptop" [size]="16"></lucide-icon></b>
          <span>
            <strong>Desktop (800 × 560)</strong>
            <small>{{ s.desktopName }}</small>
            <em>{{ s.desktopPreview ? '✓ Personalizada' : 'Predeterminada' }}</em>
          </span>
        </label>

        <label class="upload-card">
          <input
            type="file"
            accept="image/webp,image/png,image/jpeg"
            (change)="onFileUpload($event, 'mobile')"
          />
          <b><lucide-icon name="smartphone" [size]="16"></lucide-icon></b>
          <span>
            <strong>Mobile (420 × 420)</strong>
            <small>{{ s.mobileName }}</small>
            <em>{{ s.mobilePreview ? '✓ Personalizada' : 'Predeterminada' }}</em>
          </span>
        </label>
      </div>

      @if (resourceService.uploadError(); as errorMsg) {
        <div class="upload-error-banner" role="alert">
          <lucide-icon name="alert-triangle" [size]="14"></lucide-icon>
          <span>{{ errorMsg }}</span>
        </div>
      }

      @if (resourceService.isUploading()) {
        <div class="upload-loading-banner">
          <lucide-icon name="refresh-cw" [size]="14"></lucide-icon>
          <span>Validando y cargando recurso al CDN...</span>
        </div>
      }
    }
  `,
  styles: [`
    .form-divider {
      border-top: 1px solid var(--line);
      justify-content: space-between;
      align-items: center;
      margin: 18px 0 14px;
      padding-top: 13px;
      display: flex;

      span {
        color: var(--sub);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font: 700 8.5px/1 ui-monospace, monospace;
      }
    }

    .field {
      margin-bottom: 14px;
      display: block;

      span {
        color: var(--ink);
        margin-bottom: 5px;
        font-size: 11px;
        font-weight: 800;
        display: block;
      }

      input, textarea {
        width: 100%;
        color: var(--body);
        background: #fff;
        border: 1.5px solid #dddae5;
        border-radius: 7px;
        outline: 0;
        padding: 9px 12px;
        font-size: 11.5px;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;

        &:focus {
          border-color: var(--blue);
          box-shadow: 0 0 0 3px rgba(46, 19, 245, 0.08);
        }
      }

      textarea {
        resize: vertical;
        line-height: 1.45;
      }
    }

    .field-label {
      color: var(--ink);
      margin-bottom: 7px;
      font-size: 11px;
      font-weight: 800;
      display: block;
    }

    .two-fields {
      align-items: flex-start;
      gap: 10px;
      display: flex;

      .field {
        flex: 1;
        min-width: 0;
      }
    }

    .upload-grid {
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 14px;
      display: grid;
    }

    .upload-card {
      cursor: pointer;
      background: rgba(46, 19, 245, 0.02);
      border: 1px dashed rgba(46, 19, 245, 0.3);
      grid-template-columns: 32px 1fr;
      align-items: center;
      gap: 9px;
      min-width: 0;
      padding: 12px;
      display: grid;
      border-radius: 6px;
      transition: background 0.15s ease;

      &:hover {
        background: rgba(46, 19, 245, 0.06);
      }

      input {
        opacity: 0;
        pointer-events: none;
        position: absolute;
        width: 0;
        height: 0;
      }

      > b {
        width: 32px;
        height: 32px;
        color: var(--blue);
        background: #fff;
        place-items: center;
        display: grid;
        border-radius: 6px;
        font-size: 14px;
      }

      > span {
        gap: 2px;
        min-width: 0;
        display: grid;

        strong {
          color: var(--ink);
          font-size: 10px;
        }

        small {
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #77727c;
          font-size: 9px;
          overflow: hidden;
        }

        em {
          color: var(--sub);
          font: 600 8px/1.2 ui-monospace, monospace;
          font-style: normal;
        }
      }
    }

    .upload-error-banner {
      margin-top: 10px;
      padding: 9px 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      color: #991b1b;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 600;
    }

    .upload-loading-banner {
      margin-top: 10px;
      padding: 9px 12px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      color: #1e40af;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 600;
    }

    @media (width <= 620px) {
      .two-fields, .upload-grid {
        flex-direction: column;
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SlideFormComponent {
  readonly campaignService = inject(CampaignService);
  readonly resourceService = inject(ResourceService);

  onFieldChange(field: string, event: Event): void {
    const val = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.campaignService.updateSelectedSlide({ [field]: val });
  }

  onFileUpload(event: Event, target: 'desktop' | 'mobile'): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.resourceService.simulateImageUpload(input.files[0], target);
    }
  }
}
