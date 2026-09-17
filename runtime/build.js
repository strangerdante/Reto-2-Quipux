const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const OUTPUT_DIR = path.join(__dirname, '..', 'server', 'storage', 'resources', 'runtime');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'quipux-popup-runtime.js');

function bundle() {
  console.log('📦 Compilando Web Component autónomo (Data Plane)...');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Leer archivos fuente
  const manifestLoader = fs.readFileSync(path.join(SRC_DIR, 'manifest-loader.js'), 'utf-8').replace(/export /g, '');
  const ruleEvaluator = fs.readFileSync(path.join(SRC_DIR, 'rule-evaluator.js'), 'utf-8').replace(/export /g, '');
  const focusTrap = fs.readFileSync(path.join(SRC_DIR, 'focus-trap.js'), 'utf-8').replace(/export /g, '');
  const datalayer = fs.readFileSync(path.join(SRC_DIR, 'datalayer.js'), 'utf-8').replace(/export /g, '');
  const popupElement = fs.readFileSync(path.join(SRC_DIR, 'quipux-popup.js'), 'utf-8')
    .replace(/import .*;(\r?\n)?/g, '')
    .replace(/export /g, '');
  const loader = fs.readFileSync(path.join(SRC_DIR, 'loader.js'), 'utf-8')
    .replace(/import .*;(\r?\n)?/g, '');

  const bundled = `/**
 * Quipux Popup Studio - Autonomous Runtime Web Component (Data Plane)
 * Licencia: Propietario Quipux 2026
 * Características: Shadow DOM, Idempotente (AC-16), SPA Routing (AC-17), a11y (AC-18), Anti-PII dataLayer (AC-21)
 */
(function(window, document) {
  'use strict';

  ${manifestLoader}

  ${ruleEvaluator}

  ${focusTrap}

  ${datalayer}

  ${popupElement}

  ${loader}

})(window, document);
`;

  fs.writeFileSync(OUTPUT_FILE, bundled, 'utf-8');
  const stats = fs.statSync(OUTPUT_FILE);
  const sizeKb = (stats.size / 1024).toFixed(2);
  console.log(`✅ Web Component compilado exitosamente: ${OUTPUT_FILE} (${sizeKb} KB)`);
}

bundle();
