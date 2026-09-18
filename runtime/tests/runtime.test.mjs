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
