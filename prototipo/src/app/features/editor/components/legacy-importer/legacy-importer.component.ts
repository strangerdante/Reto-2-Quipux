import { Component, inject, signal } from '@angular/core';
import { CampaignService } from '@core/services/campaign.service';
import { ToastService } from '@core/services/toast.service';
import { APP_CONFIG } from '@core/config/app-config';
import { LucideAngularModule } from 'lucide-angular';
import { Slide } from '@core/models/campaign.model';

@Component({
  selector: 'app-legacy-importer',
  imports: [LucideAngularModule],
  template: `
    <button class="importer-trigger-btn" (click)="isOpen.set(true)" title="Importar modal heredado (AP-04)">
      <lucide-icon name="download" [size]="14"></lucide-icon> Importar HTML Legado (AP-04)
    </button>

    @if (isOpen()) {
      <div class="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="importer-title">
        <div class="importer-dialog">
          <header>
            <div>
              <h2 id="importer-title">Importador de Popups Legados (AngularJS / GTM)</h2>
              <p>
                Pega el fragmento de código HTML histórico utilizado en etiquetas de Tag Manager.
                El convertidor extraerá automáticamente imágenes, textos y CTAs hacia el nuevo formato estructurado (<strong>AP-04</strong>).
              </p>
            </div>
            <button (click)="isOpen.set(false)" aria-label="Cerrar">
              <lucide-icon name="x" [size]="16"></lucide-icon>
            </button>
          </header>

          <div class="importer-body">
            <label>
              <span>CÓDIGO HTML / SNIPPET DE GTM</span>
              <textarea
                rows="8"
                [value]="pastedHtml()"
                (input)="onTextChange($event)"
                placeholder="<div class='modal-slider' ng-controller='...'>
  <div class='slide'>
    <h2>Aviso importante</h2>
    <img src='https://cdn.quipux.com/.../img.png' />
    <p>Texto del trámite vehicular...</p>
    <a href='https://valledelcauca.gov.co/pagos'>Pagar en línea</a>
  </div>
</div>"
              ></textarea>
            </label>

            <div class="example-box">
              <button class="mini-btn" (click)="loadExampleSnippet()">
                Cargar snippet de ejemplo de AngularJS
              </button>
            </div>
          </div>

          <footer>
            <button class="q-button secondary" (click)="isOpen.set(false)">Cancelar</button>
            <button class="q-button primary" [disabled]="!pastedHtml().trim()" (click)="processHtml()">
              Convertir e importar slides
            </button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    .importer-trigger-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      font-size: 11px;
      font-weight: 700;
      color: var(--ink);
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: #f8f9fa;
        color: var(--blue);
        border-color: var(--blue);
      }
    }

    .dialog-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(20, 16, 31, 0.75);
      backdrop-filter: blur(4px);
      z-index: 95;
      display: grid;
      place-items: center;
      padding: 20px;
    }

    .importer-dialog {
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 12px;
      width: 100%;
      max-width: 620px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);

      header {
        padding: 20px 24px;
        border-bottom: 1px solid var(--line-soft);
        display: flex;
        justify-content: space-between;
        align-items: flex-start;

        h2 {
          margin: 0 0 6px;
          font-size: 17px;
          font-weight: 800;
          color: var(--ink);
        }

        p {
          margin: 0;
          font-size: 12px;
          color: var(--sub);
          line-height: 1.4;
        }

        button {
          background: transparent;
          border: 0;
          cursor: pointer;
          color: var(--sub);
          padding: 4px;
        }
      }
    }

    .importer-body {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;

      label {
        display: flex;
        flex-direction: column;
        gap: 6px;

        span {
          font: 700 9px ui-monospace, monospace;
          color: var(--sub);
          letter-spacing: 0.08em;
        }

        textarea {
          width: 100%;
          font-family: ui-monospace, monospace;
          font-size: 11px;
          padding: 10px;
          border: 1px solid var(--line);
          border-radius: 6px;
          color: var(--ink);
          background: #fafafa;
          box-sizing: border-box;

          &:focus {
            outline: none;
            border-color: var(--blue);
            background: #fff;
          }
        }
      }
    }

    .example-box {
      .mini-btn {
        background: transparent;
        border: 0;
        color: var(--blue);
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        padding: 0;
        text-decoration: underline;
      }
    }

    footer {
      padding: 16px 24px;
      border-top: 1px solid var(--line-soft);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
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
  `]
})
export class LegacyImporterComponent {
  private readonly campaignService = inject(CampaignService);
  private readonly toastService = inject(ToastService);
  private readonly config = inject(APP_CONFIG);

  readonly isOpen = signal<boolean>(false);
  readonly pastedHtml = signal<string>('');

  onTextChange(e: Event): void {
    const val = (e.target as HTMLTextAreaElement).value;
    this.pastedHtml.set(val);
  }

  loadExampleSnippet(): void {
    const example = `<div class="quipux-modal-legacy" ng-controller="PopupCtrl">
  <div class="slide-item">
    <h2>Descuento Especial Vigencias Anteriores</h2>
    <img src="${this.config.cdnBaseUrl}/resources/tenants/valle/assets/desktop/cobro-coactivo-desk.png" alt="Descuento Valle" />
    <p>Ponte al día con tu impuesto de vehículo sin intereses de mora este mes.</p>
    <a href="https://impuestos.valledelcauca.gov.co" class="btn-cta">Pagar en línea</a>
  </div>
  <div class="slide-item">
    <h2>Facilidades y Cuotas de Pago</h2>
    <img src="${this.config.cdnBaseUrl}/resources/tenants/valle/assets/desktop/acuerdos-pago-desk.png" alt="Acuerdos de pago" />
    <p>Solicita un acuerdo de pago diferido hasta en 12 meses sin codeudor.</p>
    <a href="https://impuestos.valledelcauca.gov.co/acuerdos" class="btn-cta">Solicitar acuerdo</a>
  </div>
</div>`;
    this.pastedHtml.set(example);
  }

  processHtml(): void {
    const html = this.pastedHtml().trim();
    if (!html) return;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Buscar contenedores de slides o elementos con clase slide / carrusel
      let slideNodes = Array.from(doc.querySelectorAll('.slide, .slide-item, .carousel-item, [ng-repeat]'));
      if (slideNodes.length === 0) {
        // Fallback: usar el body o div raíz si no hay clases identificables
        slideNodes = [doc.body];
      }

      const extractedSlides: Slide[] = [];

      slideNodes.forEach((node, idx) => {
        const titleEl = node.querySelector('h1, h2, h3, h4, .title, strong');
        const title = titleEl?.textContent?.trim() || `Slide Importado ${idx + 1}`;

        const pEl = node.querySelector('p, .desc, .description, span');
        const description = pEl?.textContent?.trim() || 'Descripción importada desde HTML legado de AngularJS.';

        const imgEl = node.querySelector('img') as HTMLImageElement | null;
        const imgSrc = imgEl?.getAttribute('src') || '';
        const imgAlt = imgEl?.getAttribute('alt') || title;

        const aEl = node.querySelector('a, button, .cta') as HTMLAnchorElement | null;
        const ctaText = aEl?.textContent?.trim() || 'Ver información';
        const link = aEl?.getAttribute('href') || 'https://www.quipux.com';

        extractedSlides.push({
          id: Date.now() + idx,
          order: idx + 1,
          active: true,
          name: `Importado ${idx + 1}`,
          title,
          description,
          cta: ctaText,
          link,
          alt: imgAlt,
          desktopName: imgSrc.split('/').pop() || 'imagen-legada.png',
          mobileName: imgSrc.split('/').pop() || 'imagen-legada.png',
          desktopPreview: imgSrc || null,
          mobilePreview: imgSrc || null
        });
      });

      if (extractedSlides.length === 0) {
        this.toastService.show('No se pudieron extraer slides válidos del código HTML');
        return;
      }

      // Reemplazar o añadir slides en la campaña activa
      this.campaignService.activeCampaign.update(c => ({
        ...c,
        name: c.name + ' (Importada AP-04)',
        slides: extractedSlides
      }));
      this.campaignService.selectSlide(extractedSlides[0].id);

      this.isOpen.set(false);
      this.pastedHtml.set('');
      this.toastService.show(`🎉 AP-04: ¡${extractedSlides.length} slide(s) importado(s) exitosamente desde AngularJS!`);
    } catch (err: any) {
      this.toastService.show(`Error al parsear el HTML: ${err.message}`);
    }
  }
}
