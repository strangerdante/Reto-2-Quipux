import { QuipuxPopupStudioElement } from './quipux-popup.js';

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
  function mount(currentRoute) {
    const existing = document.querySelector('quipux-popup-studio');
    if (existing) return;

    const popup = document.createElement('quipux-popup-studio');
    const curScript = document.currentScript || document.querySelector('script[data-tenant]');

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
      mount(newPath);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      mount(window.location.pathname);
      setupSpaListeners();
    });
  } else {
    mount(window.location.pathname);
    setupSpaListeners();
  }
})();
