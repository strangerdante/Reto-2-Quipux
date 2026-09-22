import { Component, computed, inject, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { CampaignService } from '@core/services/campaign.service';
import { ResourceService } from '@core/services/resource.service';
import { ToastService } from '@core/services/toast.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-preview-canvas',
  imports: [UpperCasePipe, LucideAngularModule],
  template: `
    <section class="preview-panel">
      <!-- Toolbar superior de previsualización -->
      <div class="preview-toolbar">
        <span>
          <i></i>Simulador en vivo activo
        </span>

        <div class="device-switcher">
          <button
            [class.active]="campaignService.previewMode() === 'desktop'"
            (click)="campaignService.setPreviewMode('desktop')"
            style="display: inline-flex; align-items: center; gap: 4px;"
          >
            <lucide-icon name="monitor" [size]="12"></lucide-icon> Escritorio
          </button>
          <button
            [class.active]="campaignService.previewMode() === 'mobile'"
            (click)="campaignService.setPreviewMode('mobile')"
            style="display: inline-flex; align-items: center; gap: 4px;"
          >
            <lucide-icon name="smartphone" [size]="12"></lucide-icon> Móvil
          </button>
        </div>

        <b>MOCK PORTAL</b>
      </div>

      <!-- Escenario de simulación -->
      <div class="preview-stage" [class.mobile]="campaignService.previewMode() === 'mobile'">
        <div class="portal-mock" aria-hidden="true">
          <div class="portal-nav">
            <span>Q</span>
            <i></i>
          </div>
          <div class="portal-lines">
            <b></b><b></b><b></b>
            <section><i></i><i></i><i></i></section>
          </div>
        </div>

        @if (!isBanner()) {
          <div class="portal-overlay" aria-hidden="true"></div>
        }

        <!-- Componente Interactivo Gobernado -->
        @if (campaignService.visibleSlide(); as s) {
          @if (isBanner()) {
            <!-- Banner Horizontal Superior Gobernado (AP-05) -->
            <div
              class="banner-preview"
              role="region"
              aria-label="Aviso institucional superior"
            >
              <div class="banner-badge-wrapper">
                <span class="banner-badge">
                  <lucide-icon name="megaphone" [size]="12"></lucide-icon>
                  AVISO VIAL
                </span>
                <span class="banner-tenant-tag">{{ campaignService.activeCampaign().tenant }}</span>
                @if (campaignService.activeCampaign().slides.length > 1) {
                  <div class="banner-nav">
                    <button type="button" (click)="campaignService.prevPreviewSlide()" aria-label="Aviso anterior">
                      <lucide-icon name="chevron-left" [size]="11"></lucide-icon>
                    </button>
                    <span>{{ campaignService.previewIndex() + 1 }}/{{ campaignService.activeCampaign().slides.length }}</span>
                    <button type="button" (click)="campaignService.nextPreviewSlide()" aria-label="Aviso siguiente">
                      <lucide-icon name="chevron-right" [size]="11"></lucide-icon>
                    </button>
                  </div>
                }
              </div>

              <div class="banner-content">
                <strong class="banner-title">{{ s.title }}</strong>
                <span class="banner-desc">{{ s.description }}</span>
              </div>

              <div class="banner-actions">
                <a [href]="s.link" target="_blank" rel="noopener noreferrer" class="banner-cta">
                  <span>{{ s.cta }}</span>
                  <lucide-icon name="arrow-right" [size]="12"></lucide-icon>
                </a>
                <button class="banner-close" (click)="onSimulateClose()" aria-label="Cerrar banner">
                  <lucide-icon name="x" [size]="13"></lucide-icon>
                </button>
              </div>
            </div>
          } @else {
            <!-- Componente Modal Interactivo -->
            <div
              class="modal-preview"
              [class]="'layout-' + campaignService.activeCampaign().layout"
              role="dialog"
              aria-modal="true"
              [attr.aria-label]="s.title"
            >
              <button class="modal-close" (click)="onSimulateClose()" aria-label="Cerrar modal">
                <lucide-icon name="x" [size]="14"></lucide-icon>
              </button>

              <!-- Sección visual / imagen (si layout no es 'content') -->
              @if (campaignService.activeCampaign().layout !== 'content') {
                <div class="modal-image">
                  @if (currentPreviewImage(); as imgUrl) {
                    @if (!failedImageUrls()[imgUrl]) {
                      <img [src]="imgUrl" [alt]="s.alt || s.title" (error)="onImageError(imgUrl)" />
                    } @else {
                      <div class="brand-visual">
                        <img src="brand/isologo.png" alt="Quipux" />
                        <span>CANALES DIGITALES</span>
                        <small>Soluciones de movilidad inteligente y gobierno digital.</small>
                      </div>
                    }
                  } @else {
                    <div class="brand-visual">
                      <img src="brand/isologo.png" alt="Quipux" />
                      <span>CANALES DIGITALES</span>
                      <small>Soluciones de movilidad inteligente y gobierno digital.</small>
                    </div>
                  }
                </div>
              }

              <!-- Contenido textual del modal -->
              <div class="modal-copy">
                <span>QUIPUX · SERVICIOS DIGITALES</span>
                <h2>{{ s.title }}</h2>
                <p>{{ s.description }}</p>
                <a [href]="s.link" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 6px;">
                  {{ s.cta }} <b><lucide-icon name="arrow-right" [size]="12"></lucide-icon></b>
                </a>
              </div>

              <!-- Controles y puntos de navegación del carrusel -->
              @if (campaignService.activeCampaign().slides.length > 1) {
                <button
                  class="modal-nav-arrow prev"
                  (click)="campaignService.prevPreviewSlide()"
                  aria-label="Slide anterior"
                  type="button"
                >
                  <lucide-icon name="chevron-left" [size]="14"></lucide-icon>
                </button>
                <button
                  class="modal-nav-arrow next"
                  (click)="campaignService.nextPreviewSlide()"
                  aria-label="Slide siguiente"
                  type="button"
                >
                  <lucide-icon name="chevron-right" [size]="14"></lucide-icon>
                </button>

                <div class="preview-dots" role="tablist" aria-label="Navegación de slides">
                  @for (slide of campaignService.activeCampaign().slides; track slide.id; let idx = $index) {
                    <button
                      [class.active]="idx === campaignService.previewIndex()"
                      (click)="campaignService.setPreviewIndex(idx)"
                      [attr.aria-label]="'Ir a slide ' + (idx + 1)"
                      type="button"
                    ></button>
                  }
                </div>
              }
            </div>
          }
        }
      </div>

      <!-- Barra de metadatos de preview -->
      <footer class="preview-meta">
        <span>PREVIEW</span>
        <code>{{ resourceService.rootPath() }}</code>
        <b>{{ campaignService.previewMode() | uppercase }}</b>
      </footer>
    </section>
  `,
  styles: [`
    .preview-panel {
      background: #eeedf1;
      grid-template-rows: 52px 1fr 56px;
      min-width: 0;
      display: grid;
      overflow: hidden;
      height: 100%;
    }

    .preview-toolbar {
      border-bottom: 1px solid var(--line);
      background: #fafafb;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      padding: 0 16px;
      display: grid;

      > span {
        color: #66616a;
        font-size: 10px;
        font-weight: 800;

        i {
          background: var(--green);
          border-radius: 50%;
          width: 7px;
          height: 7px;
          margin-right: 6px;
          display: inline-block;
          box-shadow: 0 0 0 4px rgba(93, 201, 154, 0.2);
        }
      }

      b {
        color: var(--purple);
        text-transform: uppercase;
        background: rgba(91, 25, 209, 0.08);
        border: 1px solid rgba(91, 25, 209, 0.2);
        justify-self: end;
        padding: 4px 8px;
        font-size: 8px;
        border-radius: 4px;
      }
    }

    .device-switcher {
      border: 1px solid var(--line);
      background: #fff;
      border-radius: 7px;
      padding: 3px;
      display: flex;
      gap: 2px;

      button {
        color: #77727c;
        background: transparent;
        border: 0;
        border-radius: 5px;
        padding: 5px 10px;
        font-size: 9.5px;
        cursor: pointer;
        transition: all 0.15s ease;

        &.active {
          color: var(--blue);
          background: rgba(46, 19, 245, 0.1);
          font-weight: 800;
        }
      }
    }

    .preview-stage {
      place-items: center;
      padding: 25px;
      display: grid;
      position: relative;
      overflow: auto;
    }

    .portal-mock {
      border: 1px solid var(--line);
      background: #fff;
      position: absolute;
      inset: 20px;
      overflow: hidden;
      box-shadow: 0 8px 22px rgba(33, 28, 51, 0.08);
      border-radius: 8px;
    }

    .portal-nav {
      border-bottom: 1px solid var(--line-soft);
      align-items: center;
      gap: 15px;
      height: 48px;
      padding: 0 17px;
      display: flex;

      span {
        background: var(--ink);
        width: 27px;
        height: 27px;
        color: var(--sky);
        place-items: center;
        font-weight: 900;
        display: grid;
        border-radius: 4px;
        font-size: 13px;
      }

      i {
        background: #e9e7eb;
        border-radius: 99px;
        width: 55px;
        height: 6px;
      }
    }

    .portal-lines {
      gap: 10px;
      padding: 28px;
      display: grid;

      > b {
        background: #ecebef;
        border-radius: 99px;
        height: 9px;

        &:first-child { width: 40%; height: 18px; }
        &:nth-child(2) { width: 75%; }
        &:nth-child(3) { width: 58%; }
      }

      section {
        gap: 12px;
        margin-top: 18px;
        display: flex;

        i {
          background: #f1f0f3;
          flex: 1;
          height: 92px;
          border-radius: 4px;
        }
      }
    }

    .portal-overlay {
      backdrop-filter: blur(2px);
      background: rgba(33, 28, 51, 0.7);
      position: absolute;
      inset: 20px;
      border-radius: 8px;
    }

    .banner-preview {
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      z-index: 10;
      background: #211c33;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      border-bottom: 2px solid var(--sky);
      padding: 10px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 6px 20px rgba(33, 28, 51, 0.25);
      animation: qSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .banner-badge-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .banner-badge {
      background: var(--blue);
      color: #fff;
      font: 800 9px/1.2 ui-monospace, monospace;
      letter-spacing: 0.05em;
      padding: 4px 7px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .banner-tenant-tag {
      color: var(--sky);
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .banner-nav {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      background: rgba(255, 255, 255, 0.1);
      padding: 2px 6px;
      border-radius: 4px;

      button {
        background: transparent;
        border: 0;
        color: #fff;
        cursor: pointer;
        padding: 0;
        display: grid;
        place-items: center;
        opacity: 0.8;
        &:hover { opacity: 1; }
      }

      span {
        font-size: 8.5px;
        color: #ddd;
        font-family: ui-monospace, monospace;
      }
    }

    .banner-content {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: baseline;
      gap: 10px;
      overflow: hidden;
    }

    .banner-title {
      color: #fff;
      font-size: 12px;
      font-weight: 800;
      white-space: nowrap;
    }

    .banner-desc {
      color: #d1ced7;
      font-size: 11px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .banner-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }

    .banner-cta {
      background: #fff;
      color: var(--ink);
      font-size: 10.5px;
      font-weight: 800;
      padding: 5px 12px;
      border-radius: 5px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.15s ease;

      &:hover {
        background: var(--sky);
        color: var(--ink);
      }
    }

    .banner-close {
      background: rgba(255, 255, 255, 0.08);
      border: 0;
      color: #b5b0be;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
      }
    }

    @keyframes qSlideDown {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .modal-preview {
      z-index: 2;
      background: #fff;
      border-radius: 16px;
      width: min(610px, 88%);
      min-height: 310px;
      display: grid;
      position: relative;
      overflow: hidden;
      box-shadow: 0 25px 65px rgba(16, 12, 26, 0.4);

      &.layout-side {
        grid-template-columns: 43% 57%;
      }

      &.layout-top {
        grid-template-rows: 170px auto;
        width: min(490px, 83%);
      }

      &.layout-content {
        grid-template-columns: 1fr;
        width: min(430px, 78%);
      }
    }

    .modal-close {
      z-index: 4;
      width: 28px;
      height: 28px;
      color: var(--ink);
      background: rgba(255, 255, 255, 0.9);
      border: 0;
      border-radius: 50%;
      font-size: 18px;
      font-weight: bold;
      position: absolute;
      top: 12px;
      right: 12px;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      display: grid;
      place-items: center;

      &:hover {
        background: #fff;
      }
    }

    .modal-image {
      background: var(--ink);
      min-height: 230px;
      overflow: hidden;

      > img {
        object-fit: cover;
        width: 100%;
        height: 100%;
        min-height: 230px;
        display: block;
      }
    }

    .brand-visual {
      color: #fff;
      background: radial-gradient(circle at 80% 15%, rgba(97, 199, 208, 0.8), transparent 28%),
                  linear-gradient(145deg, #211c33 8%, #352665 65%, #2e13f5 130%);
      flex-direction: column;
      justify-content: flex-end;
      height: 100%;
      min-height: 230px;
      padding: 25px;
      display: flex;
      position: relative;
      overflow: hidden;

      &:before, &:after {
        content: "";
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 50%;
        position: absolute;
      }
      &:before {
        width: 210px;
        height: 210px;
        top: -70px;
        right: -110px;
      }
      &:after {
        width: 120px;
        height: 120px;
        bottom: 40px;
        left: -55px;
      }

      img {
        width: 44px;
        height: 44px;
        margin-bottom: 12px;
        position: relative;
      }

      span {
        color: var(--sky);
        letter-spacing: 0.15em;
        text-transform: uppercase;
        font: 800 8.5px/1 ui-monospace, monospace;
        position: relative;
      }

      small {
        color: rgba(255, 255, 255, 0.72);
        max-width: 180px;
        margin-top: 5px;
        font-size: 9px;
        line-height: 1.45;
        position: relative;
      }
    }

    .modal-copy {
      flex-direction: column;
      justify-content: center;
      padding: 42px 35px 38px;
      display: flex;

      > span {
        color: var(--blue);
        letter-spacing: 0.15em;
        font: 800 7px/1 ui-monospace, monospace;
      }

      h2 {
        color: var(--ink);
        letter-spacing: -0.035em;
        margin: 9px 0 10px;
        font-size: clamp(18px, 2vw, 24px);
        font-weight: 900;
        line-height: 1.1;
      }

      p {
        color: #6d6872;
        margin: 0 0 18px;
        font-size: 11px;
        line-height: 1.55;
      }

      a {
        background: var(--blue);
        color: #fff;
        border-radius: 7px;
        align-self: flex-start;
        padding: 9px 15px;
        font-size: 9.5px;
        font-weight: 900;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: background 0.15s ease;

        &:hover {
          background: #1a0bcf;
        }
      }
    }

    .modal-nav-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 5;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(33, 28, 51, 0.08);
      box-shadow: 0 3px 12px rgba(16, 12, 26, 0.1);
      color: var(--ink);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      opacity: 0.88;

      &:hover {
        opacity: 1;
        background: #ffffff;
        color: var(--blue);
        border-color: rgba(46, 19, 245, 0.25);
        transform: translateY(-50%) scale(1.08);
        box-shadow: 0 5px 16px rgba(46, 19, 245, 0.2);
      }

      &:active {
        transform: translateY(-50%) scale(0.96);
      }

      &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px var(--blue);
        opacity: 1;
      }

      &.prev {
        left: 10px;
      }

      &.next {
        right: 10px;
      }
    }

    .preview-dots {
      z-index: 3;
      gap: 5px;
      display: flex;
      position: absolute;
      bottom: 14px;
      left: 50%;
      transform: translateX(-50%);

      button {
        background: #cac6ce;
        border: 0;
        border-radius: 99px;
        width: 6px;
        height: 6px;
        padding: 0;
        cursor: pointer;
        transition: all 0.2s ease;

        &.active {
          background: var(--blue);
          width: 16px;
        }
      }
    }

    .preview-meta {
      border-top: 1px solid var(--line);
      background: #fafafb;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 10px;
      padding: 0 16px;
      display: grid;

      span {
        color: var(--sub);
        text-transform: uppercase;
        font: 700 8px/1 ui-monospace, monospace;
      }

      code {
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #68636d;
        font-size: 9px;
        overflow: hidden;
      }

      b {
        border: 1px solid var(--line);
        color: #85808a;
        padding: 4px 8px;
        font-size: 8px;
        border-radius: 4px;
      }
    }

    // Modo Móvil
    .preview-stage.mobile {
      .portal-mock, .portal-overlay {
        width: 310px;
        left: 50%;
        right: auto;
        transform: translateX(-50%);
      }

      .banner-preview {
        width: 310px;
        left: 50%;
        right: auto;
        transform: translateX(-50%);
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        padding: 10px 12px;
      }

      .banner-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        width: 100%;

        .banner-title, .banner-desc {
          white-space: normal;
        }
      }

      .banner-actions {
        width: 100%;
        justify-content: space-between;
      }

      .modal-preview {
        grid-template-rows: 245px auto;
        grid-template-columns: 1fr;
        width: 278px;

        &.layout-content {
          grid-template-rows: auto;
        }
      }

      .modal-copy {
        padding: 24px 20px 32px;

        h2 {
          font-size: 17px;
        }
      }

      .modal-nav-arrow {
        top: 122px;
        width: 26px;
        height: 26px;
      }

      .modal-preview.layout-content .modal-nav-arrow {
        top: 50%;
      }
    }

    @media (width <= 620px) {
      .preview-toolbar {
        grid-template-columns: auto 1fr;
        b { display: none; }
        .device-switcher { justify-self: end; }
      }
      .preview-stage {
        padding: 12px;
      }
      .portal-mock, .portal-overlay {
        inset: 12px;
      }
      .modal-preview {
        width: 280px;
      }
      .modal-nav-arrow {
        top: 122px;
        width: 26px;
        height: 26px;
      }
      .modal-preview.layout-content .modal-nav-arrow {
        top: 50%;
      }
    }
  `]
})
export class PreviewCanvasComponent {
  readonly campaignService = inject(CampaignService);
  readonly resourceService = inject(ResourceService);
  private readonly toastService = inject(ToastService);

  readonly failedImageUrls = signal<Record<string, boolean>>({});

  readonly currentPreviewImage = computed(() => {
    const slide = this.campaignService.visibleSlide();
    if (!slide) return null;
    const mode = this.campaignService.previewMode();
    return mode === 'desktop' ? slide.desktopPreview : slide.mobilePreview;
  });

  readonly isBanner = computed(() => {
    const c = this.campaignService.activeCampaign();
    return c.type === 'Banner horizontal';
  });

  onImageError(url: string): void {
    this.failedImageUrls.update(map => ({ ...map, [url]: true }));
  }

  onSimulateClose(): void {
    const msg = this.isBanner()
      ? 'Simulación: Cierre de banner superior disparado (evento dataLayer: quipux_modal_close)'
      : 'Simulación: Cierre de modal disparado (evento dataLayer: quipux_modal_close)';
    this.toastService.show(msg);
  }
}
