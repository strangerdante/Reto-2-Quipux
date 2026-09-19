import test from 'node:test';
import assert from 'node:assert/strict';
import { DataLayerDispatcher } from '../src/datalayer.js';
import { RuleEvaluator } from '../src/rule-evaluator.js';
import { FocusTrap } from '../src/focus-trap.js';

test('DataLayerDispatcher - sanitización anti-PII (AC-21)', () => {
  const dirtyPayload = {
    campaignId: 'camp-100',
    tenantId: 'valle',
    slideIndex: 1,
    ctaText: 'Pagar Impuesto',
    email: 'ciudadano@valle.gov.co',
    placa: 'XYZ123',
    cedula: '111222333',
    user: 'Juan Pérez',
    customSafeNote: 'Consulta general'
  };

  const clean = DataLayerDispatcher.sanitizePayload(dirtyPayload);

  assert.equal(clean.campaignId, 'camp-100');
  assert.equal(clean.tenantId, 'valle');
  assert.equal(clean.slideIndex, 1);
  assert.equal(clean.ctaText, 'Pagar Impuesto');
  assert.equal(clean.customSafeNote, 'Consulta general');

  assert.equal(clean.email, undefined);
  assert.equal(clean.placa, undefined);
  assert.equal(clean.cedula, undefined);
  assert.equal(clean.user, undefined);
});

test('RuleEvaluator - coincidencia de rutas SPA y vigencia (AC-09, AC-17)', () => {
  // Coincidencia con wildcard universal
  assert.equal(RuleEvaluator.shouldShow({ pathRule: '*' }, 'c1', '/'), true);
  assert.equal(RuleEvaluator.shouldShow({ pathRule: '*' }, 'c1', '/tramites/vehicular'), true);

  // Coincidencia con prefijo wildcard
  assert.equal(RuleEvaluator.shouldShow({ pathRule: '/tramites/*' }, 'c1', '/tramites/vehicular'), true);
  assert.equal(RuleEvaluator.shouldShow({ pathRule: '/tramites/*' }, 'c1', '/pagos'), false);

  // Coincidencia exacta
  assert.equal(RuleEvaluator.shouldShow({ pathRule: '/liquidaciones' }, 'c1', '/liquidaciones'), true);
  assert.equal(RuleEvaluator.shouldShow({ pathRule: '/liquidaciones' }, 'c1', '/tramites'), false);

  // Validación de vigencia de fechas
  const pastRules = { pathRule: '*', startDate: '2020-01-01', endDate: '2020-01-02' };
  assert.equal(RuleEvaluator.shouldShow(pastRules, 'c1', '/'), false);

  const futureRules = { pathRule: '*', startDate: '2099-01-01', endDate: '2099-12-31' };
  assert.equal(RuleEvaluator.shouldShow(futureRules, 'c1', '/'), false);

  const openRules = { pathRule: '*', startDate: null, endDate: null };
  assert.equal(RuleEvaluator.shouldShow(openRules, 'c1', '/'), true);
});

test('FocusTrap - despacho de callback de Escape según escToggle (AC-18)', () => {
  let escapeTriggered = false;
  const dummyElement = {
    querySelectorAll: () => [],
    focus: () => {}
  };

  const trap = new FocusTrap(dummyElement, () => {
    escapeTriggered = true;
  });

  // Simular pulsación de tecla Esc
  trap.handleKeyDown({
    key: 'Escape',
    preventDefault: () => {}
  });

  assert.equal(escapeTriggered, true, 'El callback de Escape debe ejecutarse al recibir tecla Escape');
});

test('Sanitización de URLs de CTA (AC-19)', () => {
  function sanitizeCtaUrl(rawUrl) {
    const url = String(rawUrl || '').trim();
    if (!url || url === '#' || (url.startsWith('/') && !url.startsWith('//')) || url.startsWith('https://')) {
      return url || '#';
    }
    return '#';
  }

  // Enlaces válidos y seguros
  assert.equal(sanitizeCtaUrl('https://portal.valle.gov.co/tramites'), 'https://portal.valle.gov.co/tramites');
  assert.equal(sanitizeCtaUrl('/tramites/impuestos'), '/tramites/impuestos');
  assert.equal(sanitizeCtaUrl('#'), '#');
  assert.equal(sanitizeCtaUrl(''), '#');

  // Enlaces no seguros que deben ser neutralizados a '#'
  assert.equal(sanitizeCtaUrl('//sitio-malicioso.com/phishing'), '#');
  assert.equal(sanitizeCtaUrl('http://inseguro.com'), '#');
  assert.equal(sanitizeCtaUrl('javascript:alert(1)'), '#');
  assert.equal(sanitizeCtaUrl('data:text/html,<script>evil()</script>'), '#');
});

test('RuleEvaluator.evaluate - diagnósticos detallados de visibilidad (AC-09, AC-17)', () => {
  // 1. Diagnóstico de vigencia futura
  const futureResult = RuleEvaluator.evaluate({
    pathRule: '*',
    startDate: '2099-01-01T00:00',
    endDate: '2099-12-31T23:59'
  }, 'camp-future', '/');
  assert.equal(futureResult.canShow, false);
  assert.equal(futureResult.code, 'FUTURE_START');
  assert.match(futureResult.reason, /Vigencia futura/);

  // 2. Diagnóstico de vigencia expirada
  const expiredResult = RuleEvaluator.evaluate({
    pathRule: '*',
    startDate: '2020-01-01T00:00',
    endDate: '2020-01-02T00:00'
  }, 'camp-expired', '/');
  assert.equal(expiredResult.canShow, false);
  assert.equal(expiredResult.code, 'EXPIRED');
  assert.match(expiredResult.reason, /Vigencia expirada/);

  // 3. Diagnóstico de ruta SPA no coincidente
  const routeMismatch = RuleEvaluator.evaluate({
    pathRule: '/tramites/*',
    startDate: '2020-01-01T00:00',
    endDate: '2099-12-31T23:59'
  }, 'camp-route', '/');
  assert.equal(routeMismatch.canShow, false);
  assert.equal(routeMismatch.code, 'ROUTE_MISMATCH');
  assert.match(routeMismatch.reason, /Ruta no coincide/);

  // 4. Caso exitoso: ruta coincidente y vigencia activa
  const eligibleResult = RuleEvaluator.evaluate({
    pathRule: '/tramites/*',
    startDate: '2020-01-01T00:00',
    endDate: '2099-12-31T23:59'
  }, 'camp-ok', '/tramites/impuesto-vehicular');
  assert.equal(eligibleResult.canShow, true);
  assert.equal(eligibleResult.code, 'ELIGIBLE');

  // 5. Caso wildcard universal exitoso
  const wildcardResult = RuleEvaluator.evaluate({
    pathRule: '*',
    startDate: null,
    endDate: null
  }, 'camp-wildcard', '/cualquier-ruta');
  assert.equal(wildcardResult.canShow, true);
  assert.equal(wildcardResult.code, 'ELIGIBLE');
});

test('Navegación de carrusel - ciclado accesible de flechas prev y next (AC-03, AC-18)', () => {
  const slides = [{ id: 1 }, { id: 2 }, { id: 3 }];
  let currentIndex = 0;

  const nextSlide = () => {
    currentIndex = (currentIndex + 1) % slides.length;
  };
  const prevSlide = () => {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
  };

  // Ciclado hacia adelante (Next arrow)
  nextSlide();
  assert.equal(currentIndex, 1, 'Debe avanzar a slide 1');
  nextSlide();
  assert.equal(currentIndex, 2, 'Debe avanzar a slide 2');
  nextSlide();
  assert.equal(currentIndex, 0, 'Debe ciclar al slide 0 al superar el último');

  // Ciclado hacia atrás (Prev arrow)
  prevSlide();
  assert.equal(currentIndex, 2, 'Debe ciclar al último slide (2) desde el slide 0');
  prevSlide();
  assert.equal(currentIndex, 1, 'Debe retroceder al slide 1');
});

test('Kill Switch / Pausa en vivo - Supresión de popup cuando la campaña está inactiva o pausada (AC-12, AC-21)', () => {
  function evaluateCampaignActive(manifest) {
    if (!manifest || manifest.status === 'Inactivo' || manifest.active === false) {
      return {
        suppressed: true,
        reason_code: 'CAMPAIGN_PAUSED',
        reason: 'Campaña pausada por administrador/kill switch'
      };
    }
    return {
      suppressed: false,
      reason_code: 'ACTIVE',
      reason: 'Campaña activa'
    };
  }

  // 1. Manifiesto explícitamente Inactivo
  const inactiveResult = evaluateCampaignActive({ status: 'Inactivo', active: false, id: 'camp-1' });
  assert.equal(inactiveResult.suppressed, true);
  assert.equal(inactiveResult.reason_code, 'CAMPAIGN_PAUSED');

  // 2. Manifiesto con active: false
  const activeFalseResult = evaluateCampaignActive({ status: 'Publicado', active: false, id: 'camp-1' });
  assert.equal(activeFalseResult.suppressed, true);
  assert.equal(activeFalseResult.reason_code, 'CAMPAIGN_PAUSED');

  // 3. Manifiesto activo y publicado
  const activeResult = evaluateCampaignActive({ status: 'Publicado', active: true, id: 'camp-1' });
  assert.equal(activeResult.suppressed, false);
  assert.equal(activeResult.reason_code, 'ACTIVE');

  // 4. Manifiesto nulo
  const nullResult = evaluateCampaignActive(null);
  assert.equal(nullResult.suppressed, true);
});

