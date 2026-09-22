const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const createResourceRouter = require('../routes/resources');

function createPngBuffer(width, height, extraBytes = 0) {
  const buf = Buffer.alloc(33 + extraBytes);
  // PNG signature
  buf.set([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], 0);
  // IHDR chunk length (13)
  buf.writeUInt32BE(13, 8);
  // IHDR chunk type
  buf.write('IHDR', 12, 'ascii');
  // Width and Height
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  // Color settings
  buf.set([8, 2, 0, 0, 0], 24);
  return buf;
}

const mockStorage = {
  saveAsset: async ({ tenantId, targetType, filename, content }) => ({
    filename,
    url: `http://localhost/resources/tenants/${tenantId}/assets/${targetType}/${filename}`,
    cdnPath: `resources/tenants/${tenantId}/assets/${targetType}/${filename}`
  }),
  listAssets: async () => []
};

async function withServer(fn) {
  const app = express();
  app.use(createResourceRouter({ storageProvider: mockStorage }));
  const server = app.listen(0);
  const port = server.address().port;
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
  }
}

test('ResourceRouter - Rechaza formatos no permitidos (AC-06)', async () => {
  await withServer(async (baseUrl) => {
    const formData = new FormData();
    const blob = new Blob(['contenido de texto'], { type: 'text/plain' });
    formData.append('file', blob, 'documento.txt');
    formData.append('targetType', 'desktop');

    const res = await fetch(`${baseUrl}/upload`, { method: 'POST', body: formData });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.valid, false);
    assert.ok(body.errors.some(e => e.includes('Formato')));
  });
});

test('ResourceRouter - Rechaza imágenes que superen 2 MB (AC-06, AC-20)', async () => {
  await withServer(async (baseUrl) => {
    const formData = new FormData();
    // Crear buffer PNG de 2.1 MB
    const largePng = createPngBuffer(800, 560, 2.1 * 1024 * 1024);
    const blob = new Blob([largePng], { type: 'image/png' });
    formData.append('file', blob, 'imagen-pesada.png');
    formData.append('targetType', 'desktop');

    const res = await fetch(`${baseUrl}/upload`, { method: 'POST', body: formData });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.valid, false);
    assert.ok(body.errors.some(e => e.includes('superando el límite máximo permitido de 2 MB')));
  });
});

test('ResourceRouter - Acepta imagen válida dentro del rango (800x560, < 2 MB)', async () => {
  await withServer(async (baseUrl) => {
    const formData = new FormData();
    // Crear buffer PNG de 800x560 (~50 KB)
    const validPng = createPngBuffer(800, 560, 50 * 1024);
    const blob = new Blob([validPng], { type: 'image/png' });
    formData.append('file', blob, 'slide-promo.png');
    formData.append('targetType', 'desktop');

    const res = await fetch(`${baseUrl}/upload`, { method: 'POST', body: formData });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.valid, true);
    assert.equal(body.dimensions, '800×560');
    assert.ok(body.filename.includes('slide-promo.png'));
  });
});

test('ResourceRouter - Rechaza dimensiones excesivas en desktop (> 1920x1200)', async () => {
  await withServer(async (baseUrl) => {
    const formData = new FormData();
    // Dimensiones 2500x1600 (excesivas para un popup)
    const bigPng = createPngBuffer(2500, 1600, 100);
    const blob = new Blob([bigPng], { type: 'image/png' });
    formData.append('file', blob, 'gigante.png');
    formData.append('targetType', 'desktop');

    const res = await fetch(`${baseUrl}/upload`, { method: 'POST', body: formData });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.valid, false);
    assert.ok(body.errors.some(e => e.includes('Dimensiones excesivas')));
  });
});
