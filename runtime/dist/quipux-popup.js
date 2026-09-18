/**
 * Quipux Popup Studio - Autonomous Runtime Web Component (Data Plane)
 * Licencia: Propietario Quipux 2026
 * Características: Shadow DOM, Idempotente (AC-16), SPA Routing (AC-17), a11y (AC-18), Anti-PII dataLayer (AC-21)
 */
(function(window, document) {
  'use strict';

  // Submódulo: Carga de manifiestos multitenant desde un CDN configurable.
class ManifestLoader {
  constructor(cdnBaseUrl) {
    const configuredBaseUrl = cdnBaseUrl || window.__QUIPUX_RUNTIME_CONFIG__?.cdnBaseUrl || window.__QUIPUX_CDN_URL__ || window.location.origin;
    const normalizedBaseUrl = String(configuredBaseUrl).replace(/\/+$/, '');
    this.tenantBaseUrl = normalizedBaseUrl.endsWith('/resources/tenants')
      ? normalizedBaseUrl
      : `${normalizedBaseUrl}/resources/tenants`;
  }

  buildUrl(tenantId, campaignId, manifestUrl) {
    const source = manifestUrl || `${this.tenantBaseUrl}/${encodeURIComponent(tenantId)}/manifests/${encodeURIComponent(campaignId)}/active.json`;
    const url = new URL(source, window.location.origin);
    url.searchParams.set('t', String(Date.now()));
    return url.toString();
  }

  async fetchActiveManifest(tenantId, campaignId = 'camp-1', manifestUrl) {
    const url = this.buildUrl(tenantId, campaignId, manifestUrl);
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status} al obtener manifest de ${url}`);
      return await response.json();
    } catch (error) {
      console.warn('[Quipux ManifestLoader] Error cargando manifest activo:', error.message);
      return null;
    }
  }
}


  // Submódulo: Evaluación de Reglas de Negocio en Runtime (AC-09, AC-17)
class RuleEvaluator {
  static shouldShow(rules, campaignId, currentPath = window.location.pathname) {
    if (!rules) return true;

    // 1. Evaluación de vigencia temporal (fechas inicio/fin ISO)
    const now = Date.now();
    if (rules.startDate) {
      const start = new Date(rules.startDate).getTime();
      if (!isNaN(start) && now < start) {
        return false; // Aún no inicia vigencia
      }
    }
    if (rules.endDate) {
      const end = new Date(rules.endDate).getTime();
      if (!isNaN(end) && now > end) {
        return false; // Vigencia expirada
      }
    }

    // 2. Evaluación de frecuencia de visualización
    const freq = rules.frequency || 'once_per_session';
    const storageKey = `qpux_popup_${campaignId}_viewed`;

    if (freq === 'once_per_session' || freq === 'Una vez por sesión') {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(storageKey)) {
        return false;
      }
    } else if (freq === 'once_per_device' || freq === 'Una vez por día') {
      if (typeof localStorage !== 'undefined') {
        const lastView = localStorage.getItem(storageKey);
        if (lastView) {
          const diffHours = (now - parseInt(lastView, 10)) / (1000 * 60 * 60);
          if (diffHours < 24) {
            return false;
          }
        }
      }
    }

    // 3. Evaluación de coincidencia de ruta SPA (soporta rutas reales y entorno simulador /portal-demo)
    const pattern = rules.pathRule;
    if (pattern && pattern !== '*' && pattern !== '/*') {
      const regexStr = '^' + pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*') + '$';
      const regex = new RegExp(regexStr);
      const normalizedPath = currentPath.replace(/^\/portal-demo/, '') || '/';
      if (!regex.test(currentPath) && !regex.test(normalizedPath)) {
        return false; // No coincide con la ruta activa
      }
    }

    return true;
  }

  static recordView(rules, campaignId) {
    const freq = rules?.frequency || 'once_per_session';
    const storageKey = `qpux_popup_${campaignId}_viewed`;
    if (freq === 'once_per_session' || freq === 'Una vez por sesión') {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(storageKey, 'true');
      }
    } else if (freq === 'once_per_device' || freq === 'Una vez por día') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(storageKey, String(Date.now()));
      }
    }
  }
}


  // Submódulo: Accesibilidad y Trampa de Foco WCAG 2.1 AA (AC-18)
class FocusTrap {
  constructor(containerElement, onEscapeCallback) {
    this.container = containerElement;
    this.onEscape = onEscapeCallback;
    this.previouslyFocusedElement = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  activate() {
    this.previouslyFocusedElement = document.activeElement;
    document.addEventListener('keydown', this.handleKeyDown);

    // Mover foco al primer elemento interactivo o al contenedor
    setTimeout(() => {
      const focusables = this.getFocusableElements();
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        this.container.focus();
      }
    }, 50);
  }

  deactivate() {
    document.removeEventListener('keydown', this.handleKeyDown);
    if (this.previouslyFocusedElement && typeof this.previouslyFocusedElement.focus === 'function') {
      this.previouslyFocusedElement.focus();
    }
  }

  getFocusableElements() {
    return Array.from(
      this.container.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => el.offsetWidth > 0 || el.offsetHeight > 0);
  }

  handleKeyDown(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault();
      if (typeof this.onEscape === 'function') {
        this.onEscape();
      }
      return;
    }

    if (e.key === 'Tab') {
      const focusables = this.getFocusableElements();
      if (focusables.length === 0) return;

      const firstElement = focusables[0];
      const lastElement = focusables[focusables.length - 1];

      if (e.shiftKey) {
        // Shift + Tab hacia atrás
        if (document.activeElement === firstElement || this.container.shadowRoot?.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab hacia adelante
        if (document.activeElement === lastElement || this.container.shadowRoot?.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }
}


  // Submódulo: Despacho de Eventos Analíticos Limpios a GTM dataLayer (AC-21)
class DataLayerDispatcher {
  static dispatch(eventName, modalMetadata) {
    if (typeof window === 'undefined') return;

    window.dataLayer = window.dataLayer || [];

    // Limpieza y sanitización de datos personales (PII)
    const sanitizedMetadata = this.sanitizePayload(modalMetadata);

    const eventPayload = {
      event: eventName,
      modal: sanitizedMetadata
    };

    window.dataLayer.push(eventPayload);

    // Evento personalizado nativo en DOM para herramientas de testing o HUD
    try {
      window.dispatchEvent(new CustomEvent('quipux:datalayer', { detail: eventPayload }));
    } catch (e) {}

    console.info(`[Quipux GTM] Evento despachado: %c${eventName}`, 'color: #2E13F5; font-weight: bold;', sanitizedMetadata);
  }

  static sanitizePayload(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const clean = {};
    const piiKeys = ['name', 'email', 'phone', 'cedula', 'documento', 'placa', 'user', 'password'];

    for (const [k, v] of Object.entries(obj)) {
      if (piiKeys.includes(k.toLowerCase())) {
        continue; // Excluir campos con posibles nombres personales
      }
      if (typeof v === 'string' && v.includes('@')) {
        continue; // Excluir posibles emails
      }
      clean[k] = v;
    }
    return clean;
  }
}


  
class QuipuxPopupStudioElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.manifest = null;
    this.currentSlideIndex = 0;
    this.autoplayInterval = null;
    this.focusTrap = null;
    this.openTime = null;
    this.isClosing = false;
    this.scheduledRenderTimeout = null;
    this.hiddenBackgroundElements = [];
  }

  sanitizeCtaUrl(rawUrl) {
    const url = String(rawUrl || '').trim();
    if (!url || url === '#' || (url.startsWith('/') && !url.startsWith('//')) || url.startsWith('https://')) {
      return url || '#';
    }
    return '#';
  }

  isolateBackground() {
    this.hiddenBackgroundElements = [];
    if (typeof document === 'undefined') return;
    const bodyChildren = document.body ? Array.from(document.body.children) : [];
    for (const child of bodyChildren) {
      if (child !== this && child.nodeType === 1 && !child.hasAttribute('aria-hidden')) {
        child.setAttribute('aria-hidden', 'true');
        this.hiddenBackgroundElements.push(child);
      }
    }
  }

  restoreBackground() {
    if (Array.isArray(this.hiddenBackgroundElements)) {
      for (const el of this.hiddenBackgroundElements) {
        if (el && typeof el.removeAttribute === 'function') {
          el.removeAttribute('aria-hidden');
        }
      }
      this.hiddenBackgroundElements = [];
    }
  }

  static get observedAttributes() {
    return ['tenant', 'campaign', 'manifest-url', 'cdn-base-url'];
  }

  connectedCallback() {
    this.init();
  }

  disconnectedCallback() {
    this.cleanup();
  }

  cleanup() {
    this.restoreBackground();
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
    if (this.scheduledRenderTimeout) {
      clearTimeout(this.scheduledRenderTimeout);
      this.scheduledRenderTimeout = null;
    }
    if (this.focusTrap) {
      this.focusTrap.deactivate();
      this.focusTrap = null;
    }
  }

  async init() {
    const tenant = this.getAttribute('tenant') || 'valle';
    const campaignId = this.getAttribute('campaign') || 'camp-1';
    const loader = new ManifestLoader(this.getAttribute('cdn-base-url'));
    const manifestUrl = this.getAttribute('manifest-url');

    this.manifest = await loader.fetchActiveManifest(tenant, campaignId, manifestUrl);
    if (!this.manifest || !this.manifest.slides || this.manifest.slides.length === 0) {
      return;
    }

    // Filtrar slides activos (AC-03)
    this.manifest.slides = this.manifest.slides.filter(s => s.active !== false);
    if (this.manifest.slides.length === 0) return;

    // Evaluar reglas de aparición (AC-09, AC-17)
    const canShow = RuleEvaluator.shouldShow(this.manifest.rules, this.manifest.id, window.location.pathname);
    if (!canShow) {
      return;
    }

    const rawDelay = Number(this.manifest.rules?.delay || 0);
    const delayMs = rawDelay > 30 ? rawDelay : Math.max(0, rawDelay * 1000);

    this.scheduledRenderTimeout = setTimeout(() => {
      this.scheduledRenderTimeout = null;
      this.render();
      RuleEvaluator.recordView(this.manifest.rules, this.manifest.id);
    }, delayMs);
  }

  render() {
    const m = this.manifest;
    this.openTime = Date.now();

    const styles = `
      :host, :root, *, .backdrop, .modal-preview {
        --quipux-ink: #211C33;
        --quipux-blue: #2E13F5;
        --quipux-sky: #61C7D0;
        --quipux-green: #5DC99A;
        --ink: #211C33;
        --blue: #2E13F5;
        --sky: #61C7D0;
        --green: #5DC99A;
        box-sizing: border-box;
      }

      :host {
        display: block;
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }

      .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(33, 28, 51, 0.75);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
        animation: qFadeIn 0.25s ease-out;
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
        animation: qPopUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        box-sizing: border-box;
      }

      .modal-preview.layout-side {
        grid-template-columns: 43% 57%;
      }

      .modal-preview.layout-top {
        grid-template-rows: 170px auto;
        grid-template-columns: 1fr;
        width: min(490px, 83%);
      }

      .modal-preview.layout-content {
        grid-template-columns: 1fr;
        width: min(430px, 78%);
      }
      .modal-preview.layout-content .modal-image {
        display: none !important;
      }

      .modal-close {
        z-index: 4;
        width: 28px;
        height: 28px;
        color: var(--ink);
        background: rgba(255, 255, 255, 0.9);
        border: 0;
        border-radius: 50%;
        position: absolute;
        top: 12px;
        right: 12px;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        display: grid;
        place-items: center;
        transition: background 0.15s ease;
      }
      .modal-close:hover {
        background: #fff;
      }

      .modal-image {
        background: var(--ink);
        min-height: 230px;
        overflow: hidden;
        position: relative;
      }
      .modal-image > picture, .modal-image > picture > img, .modal-image > img {
        object-fit: cover;
        width: 100%;
        height: 100%;
        min-height: 230px;
        display: block;
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
        box-sizing: border-box;
      }
      .brand-visual:before, .brand-visual:after {
        content: "";
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 50%;
        position: absolute;
      }
      .brand-visual:before {
        width: 210px;
        height: 210px;
        top: -70px;
        right: -110px;
      }
      .brand-visual:after {
        width: 120px;
        height: 120px;
        bottom: 40px;
        left: -55px;
      }
      .brand-visual img {
        width: 44px;
        height: 44px;
        margin-bottom: 12px;
        position: relative;
        object-fit: contain;
      }
      .brand-visual span {
        color: var(--sky);
        letter-spacing: 0.15em;
        text-transform: uppercase;
        font: 800 8.5px/1 ui-monospace, monospace;
        position: relative;
      }
      .brand-visual small {
        color: rgba(255, 255, 255, 0.72);
        max-width: 180px;
        margin-top: 5px;
        font-size: 9px;
        line-height: 1.45;
        position: relative;
      }

      .modal-copy {
        flex-direction: column;
        justify-content: center;
        padding: 42px 35px 38px;
        display: flex;
        box-sizing: border-box;
      }
      .modal-copy > span {
        color: #2E13F5;
        letter-spacing: 0.15em;
        font: 800 7px/1 ui-monospace, monospace;
        text-transform: uppercase;
      }
      .modal-copy h2 {
        color: #211C33;
        letter-spacing: -0.035em;
        margin: 9px 0 10px;
        font-size: clamp(18px, 2vw, 24px);
        font-weight: 900;
        line-height: 1.1;
      }
      .modal-copy p {
        color: #6d6872;
        margin: 0 0 18px;
        font-size: 11px;
        line-height: 1.55;
      }
      .modal-copy a {
        background: #2E13F5;
        color: #ffffff !important;
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
      }
      .modal-copy a:hover {
        background: #1a0bcf;
      }
      .modal-copy a b {
        display: inline-flex;
        align-items: center;
      }

      .preview-dots {
        z-index: 5;
        gap: 6px;
        display: flex;
        align-items: center;
        position: absolute;
        bottom: 14px;
        left: 50%;
        transform: translateX(-50%);
      }
      .preview-dots button {
        position: relative;
        background: #cac6ce;
        border: 0;
        border-radius: 99px;
        width: 6px;
        height: 6px;
        padding: 0;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        outline: none;
      }
      .preview-dots button::before {
        content: '';
        position: absolute;
        inset: -8px -6px;
      }
      .preview-dots button:hover:not(.active) {
        background: #948e9b;
        transform: scale(1.2);
      }
      .preview-dots button:focus-visible {
        box-shadow: 0 0 0 2px #2E13F5;
      }
      .preview-dots button.active {
        background: #2E13F5 !important;
        width: 16px !important;
        height: 6px !important;
      }

      @media (max-width: 620px) {
        .modal-preview {
          grid-template-rows: 245px auto;
          grid-template-columns: 1fr;
          width: 278px;
        }
        .modal-preview.layout-content {
          grid-template-rows: auto;
        }
        .modal-copy {
          padding: 24px 20px 32px;
        }
        .modal-copy h2 {
          font-size: 17px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          transition-duration: 0.01ms !important;
        }
      }

      @keyframes qFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes qPopUp {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
    `;

    const layout = m.layout || 'side';

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="backdrop" role="dialog" aria-modal="true" aria-labelledby="slide-title-el" tabindex="-1">
        <div class="modal-preview layout-${layout}">
          <button class="modal-close" aria-label="Cerrar ventana emergente" id="btn-close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>

          <div class="modal-image">
            <picture id="picture-el">
              <source media="(max-width: 620px)" id="img-source-mob">
              <img id="img-el" alt="">
            </picture>
            <div class="brand-visual" id="brand-visual-el" style="display: none;">
              <img src="/resources/brand/isologo.png" alt="Quipux" />
              <span>CANALES DIGITALES</span>
              <small>Soluciones de movilidad inteligente y gobierno digital.</small>
            </div>
          </div>

          <div class="modal-copy">
            <span>QUIPUX · SERVICIOS DIGITALES</span>
            <h2 id="slide-title-el"></h2>
            <p id="slide-desc-el"></p>
            <a href="#" id="cta-link-el" target="_blank" rel="noopener noreferrer">
              <span id="cta-text-el">Ver más</span>
              <b>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </b>
            </a>
          </div>

          <div class="preview-dots" id="dots-container" role="tablist" aria-label="Navegación de slides"></div>
        </div>
      </div>
    `;

    // Aislar accesiblemente elementos de fondo (AC-18)
    this.isolateBackground();

    // Configurar listeners de interacción
    const backdrop = this.shadowRoot.querySelector('.backdrop');
    const closeBtn = this.shadowRoot.querySelector('#btn-close');
    const ctaBtn = this.shadowRoot.querySelector('#cta-link-el');

    closeBtn.addEventListener('click', () => this.closeModal('close_button'));
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.closeModal('backdrop_click');
    });

    ctaBtn.addEventListener('click', () => {
      const currentSlide = this.manifest.slides[this.currentSlideIndex];
      DataLayerDispatcher.dispatch('quipux_modal_cta_click', {
        campaignId: this.manifest.id,
        tenantId: this.manifest.tenantId,
        slideIndex: this.currentSlideIndex + 1,
        ctaText: currentSlide.cta,
        targetUrl: currentSlide.link
      });
    });

    // Soporte para swipe táctil en móvil (AC-18)
    const card = this.shadowRoot.querySelector('.modal-preview');
    let touchStartX = 0;
    let touchStartY = 0;
    card.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    card.addEventListener('touchend', (e) => {
      if (this.manifest.slides.length > 1 && e.changedTouches.length === 1) {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
          if (deltaX < 0) {
            this.nextSlide();
          } else {
            this.prevSlide();
          }
        }
      }
    }, { passive: true });

    // Navegación accesible con flechas de teclado y respeto a escToggle (AC-18)
    backdrop.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (this.manifest?.rules?.escToggle !== false) {
          e.preventDefault();
          this.closeModal('esc_key');
        }
        return;
      }
      if (this.manifest.slides.length <= 1) return;
      if (e.key === 'ArrowRight') {
        this.nextSlide();
      } else if (e.key === 'ArrowLeft') {
        this.prevSlide();
      }
    });

    // Activar trampa de foco accesible respetando escToggle (AC-18)
    this.focusTrap = new FocusTrap(backdrop, () => {
      if (this.manifest?.rules?.escToggle !== false) {
        this.closeModal('esc_key');
      }
    });
    this.focusTrap.activate();

    // Inicializar los dots una sola vez en el DOM
    this.initDots();

    // Renderizar slide inicial
    this.updateSlideView();

    // Autoplay si está habilitado en reglas y no hay reduced-motion
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.manifest.rules?.autoplayToggle && !reducedMotion && this.manifest.slides.length > 1) {
      this.startAutoplay();
      card.addEventListener('mouseenter', () => this.stopAutoplay());
      card.addEventListener('mouseleave', () => {
        if (!this.isClosing) this.startAutoplay();
      });
    }

    // Despachar evento de impresión del modal a dataLayer (AC-21)
    DataLayerDispatcher.dispatch('quipux_modal_impression', {
      campaignId: this.manifest.id,
      version: this.manifest.version,
      tenantId: this.manifest.tenantId,
      totalSlides: this.manifest.slides.length,
      timestamp: new Date().toISOString()
    });
  }

  initDots() {
    const dotsContainer = this.shadowRoot.querySelector('#dots-container');
    if (!dotsContainer) return;

    dotsContainer.innerHTML = '';
    const slidesCount = this.manifest.slides ? this.manifest.slides.length : 0;

    if (slidesCount <= 1) {
      dotsContainer.style.display = 'none';
      return;
    }

    dotsContainer.style.display = 'flex';
    for (let idx = 0; idx < slidesCount; idx++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = idx === this.currentSlideIndex ? 'active' : '';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Ir al slide ${idx + 1}`);
      dot.setAttribute('aria-selected', idx === this.currentSlideIndex ? 'true' : 'false');
      dot.setAttribute('tabindex', idx === this.currentSlideIndex ? '0' : '-1');

      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        this.goToSlide(idx);
      });

      // Navegación accesible con flechas entre botones de dots
      dot.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const nextIdx = (idx + 1) % slidesCount;
          this.goToSlide(nextIdx);
          const nextDot = dotsContainer.querySelectorAll('button')[nextIdx];
          if (nextDot) nextDot.focus();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const prevIdx = (idx - 1 + slidesCount) % slidesCount;
          this.goToSlide(prevIdx);
          const prevDot = dotsContainer.querySelectorAll('button')[prevIdx];
          if (prevDot) prevDot.focus();
        }
      });

      dotsContainer.appendChild(dot);
    }
  }

  updateSlideView() {
    const slide = this.manifest.slides[this.currentSlideIndex];
    if (!slide) return;

    const titleEl = this.shadowRoot.querySelector('#slide-title-el');
    const descEl = this.shadowRoot.querySelector('#slide-desc-el');
    const ctaEl = this.shadowRoot.querySelector('#cta-link-el');
    const ctaTextEl = this.shadowRoot.querySelector('#cta-text-el');
    const imgEl = this.shadowRoot.querySelector('#img-el');
    const imgMob = this.shadowRoot.querySelector('#img-source-mob');
    const pictureEl = this.shadowRoot.querySelector('#picture-el');
    const brandVisualEl = this.shadowRoot.querySelector('#brand-visual-el');

    if (titleEl) titleEl.textContent = slide.title;
    if (descEl) descEl.textContent = slide.description;
    if (ctaTextEl) ctaTextEl.textContent = slide.cta || 'Ver más';
    if (ctaEl) {
      ctaEl.href = this.sanitizeCtaUrl(slide.link);
      ctaEl.target = slide.target === '_self' ? '_self' : '_blank';
      if (ctaEl.target === '_blank') {
        ctaEl.setAttribute('rel', 'noopener noreferrer');
      } else {
        ctaEl.removeAttribute('rel');
      }
    }

    const hasImg = !!(slide.desktopImage || slide.mobileImage);
    if (hasImg) {
      imgEl.src = slide.desktopImage || slide.mobileImage;
      imgEl.alt = slide.alt || slide.title || '';
      if (pictureEl) pictureEl.style.display = 'block';
      if (brandVisualEl) brandVisualEl.style.display = 'none';
      imgEl.onerror = () => {
        if (pictureEl) pictureEl.style.display = 'none';
        if (brandVisualEl) brandVisualEl.style.display = 'flex';
      };
      if (slide.mobileImage && imgMob) {
        imgMob.srcset = slide.mobileImage;
      }
    } else {
      if (pictureEl) pictureEl.style.display = 'none';
      if (brandVisualEl) brandVisualEl.style.display = 'flex';
    }

    // Actualizar dots existentes conservando los elementos DOM para permitir la transición CSS
    const dotsContainer = this.shadowRoot.querySelector('#dots-container');
    if (dotsContainer) {
      const slidesCount = this.manifest.slides ? this.manifest.slides.length : 0;
      if (slidesCount <= 1) {
        dotsContainer.style.display = 'none';
      } else {
        dotsContainer.style.display = 'flex';
        const buttons = dotsContainer.querySelectorAll('button');
        if (buttons.length !== slidesCount) {
          this.initDots();
        } else {
          buttons.forEach((dot, idx) => {
            const isActive = idx === this.currentSlideIndex;
            dot.classList.toggle('active', isActive);
            dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
            dot.setAttribute('tabindex', isActive ? '0' : '-1');
          });
        }
      }
    }

    // Despachar visualización de slide (AC-21)
    DataLayerDispatcher.dispatch('quipux_modal_slide_view', {
      campaignId: this.manifest.id,
      tenantId: this.manifest.tenantId,
      slideIndex: this.currentSlideIndex + 1,
      slideId: slide.id,
      slideTitle: slide.title
    });
  }

  nextSlide() {
    if (this.manifest.slides.length <= 1) return;
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.manifest.slides.length;
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = setInterval(() => this.nextSlide(), 4500);
    }
    this.updateSlideView();
  }

  prevSlide() {
    if (this.manifest.slides.length <= 1) return;
    this.currentSlideIndex = (this.currentSlideIndex - 1 + this.manifest.slides.length) % this.manifest.slides.length;
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = setInterval(() => this.nextSlide(), 4500);
    }
    this.updateSlideView();
  }

  goToSlide(index) {
    if (index === this.currentSlideIndex || index < 0 || index >= this.manifest.slides.length) return;
    this.currentSlideIndex = index;
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = setInterval(() => this.nextSlide(), 4500);
    }
    this.updateSlideView();
  }

  startAutoplay() {
    if (this.autoplayInterval) return;
    this.autoplayInterval = setInterval(() => this.nextSlide(), 4500);
  }

  stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }

  closeModal(reason = 'close_button') {
    if (this.isClosing) return;
    this.isClosing = true;

    const elapsedSeconds = this.openTime ? Math.round((Date.now() - this.openTime) / 1000) : 0;

    DataLayerDispatcher.dispatch('quipux_modal_close', {
      campaignId: this.manifest?.id,
      tenantId: this.manifest?.tenantId,
      closeReason: reason,
      timeViewedSeconds: elapsedSeconds
    });

    this.cleanup();
    this.remove();
  }

  checkRoute(newPath) {
    if (this.scheduledRenderTimeout) {
      clearTimeout(this.scheduledRenderTimeout);
      this.scheduledRenderTimeout = null;
    }
    if (!this.manifest) return;
    const canShow = RuleEvaluator.shouldShow(this.manifest.rules, this.manifest.id, newPath);
    const isRendered = !!this.shadowRoot.querySelector('.backdrop');
    if (isRendered && !canShow) {
      this.closeModal('route_change');
    } else if (!isRendered && canShow) {
      const rawDelay = Number(this.manifest.rules?.delay || 0);
      const delayMs = rawDelay > 30 ? rawDelay : Math.max(0, rawDelay * 1000);
      this.scheduledRenderTimeout = setTimeout(() => {
        this.scheduledRenderTimeout = null;
        if (!this.shadowRoot.querySelector('.backdrop')) {
          this.render();
          RuleEvaluator.recordView(this.manifest.rules, this.manifest.id);
        }
      }, delayMs);
    }
  }
}


  
(function () {
  'use strict';

  // 1. Verificación obligatoria de Idempotencia (AC-16)
  if (window.__QUIPUX_POPUP_LOADED__) {
    console.warn('[Quipux Loader] Cargador ya inicializado en este documento. Se ignora la inyección duplicada.');
    return;
  }
  window.__QUIPUX_POPUP_LOADED__ = true;

  // 2. Registro del Custom Element
  if (!customElements.get('quipux-popup-studio')) {
    customElements.define('quipux-popup-studio', QuipuxPopupStudioElement);
  }

  // 3. Montaje del componente en el DOM
  function getRuntimeScript() {
    if (document.currentScript instanceof HTMLScriptElement) return document.currentScript;
    return [...document.scripts].find(script => script.src.includes('quipux-popup-runtime') && script.dataset.tenant) || null;
  }

  function mount() {
    const existing = document.querySelector('quipux-popup-studio');
    if (existing) return;

    const popup = document.createElement('quipux-popup-studio');
    const curScript = getRuntimeScript();

    const urlParams = new URLSearchParams(window.location.search);
    const tenant = urlParams.get('tenant') ||
                   curScript?.getAttribute('data-tenant') ||
                   'valle';

    const defaultCamp = tenant === 'medellin' ? 'camp-med-1' : 'camp-1';
    const campaign = urlParams.get('campaign') ||
                     curScript?.getAttribute('data-campaign') ||
                     defaultCamp;

    popup.setAttribute('tenant', tenant);
    popup.setAttribute('campaign', campaign);
    const manifestUrl = curScript?.getAttribute('data-manifest-url') || window.__QUIPUX_RUNTIME_CONFIG__?.manifestUrl;
    const cdnBaseUrl = curScript?.getAttribute('data-cdn-url') || window.__QUIPUX_RUNTIME_CONFIG__?.cdnBaseUrl;
    if (manifestUrl) popup.setAttribute('manifest-url', manifestUrl);
    if (cdnBaseUrl) popup.setAttribute('cdn-base-url', cdnBaseUrl);

    document.body.appendChild(popup);
  }

  // 4. Escucha de navegación SPA (AC-17)
  function setupSpaListeners() {
    window.addEventListener('popstate', () => {
      handleRouteChange(window.location.pathname);
    });

    const wrapHistoryMethod = (type) => {
      const orig = history[type];
      return function (...args) {
        const res = orig.apply(this, args);
        handleRouteChange(window.location.pathname);
        return res;
      };
    };

    history.pushState = wrapHistoryMethod('pushState');
    history.replaceState = wrapHistoryMethod('replaceState');
  }

  function handleRouteChange(newPath) {
    const existing = document.querySelector('quipux-popup-studio');
    if (existing && typeof existing.checkRoute === 'function') {
      existing.checkRoute(newPath);
    } else {
      mount();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      mount();
      setupSpaListeners();
    });
  } else {
    mount();
    setupSpaListeners();
  }
})();


})(window, document);
