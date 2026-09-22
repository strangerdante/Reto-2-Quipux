const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const cors = require('cors');

function createTestApp(corsOrigins = ['http://localhost:4200', 'http://localhost:3000']) {
  const app = express();
  app.use(cors({
    origin(origin, callback) {
      if (!origin || origin === 'null') return callback(null, true);
      if (corsOrigins.includes('*') || corsOrigins.includes(origin)) return callback(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  }));
  app.get('/api/test', (req, res) => res.json({ ok: true }));
  return app;
}

async function withServer(app, fn) {
  const server = app.listen(0);
  const port = server.address().port;
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
  }
}

test('CORS - Acepta peticiones con Origin: null (archivos locales file:// o iframes sandboxed)', async () => {
  const app = createTestApp();
  await withServer(app, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/test`, {
      headers: { Origin: 'null' }
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), 'null');
    const data = await res.json();
    assert.deepEqual(data, { ok: true });
  });
});

test('CORS - Acepta peticiones sin cabecera Origin (curl, server-to-server, Postman)', async () => {
  const app = createTestApp();
  await withServer(app, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/test`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.deepEqual(data, { ok: true });
  });
});

test('CORS - Acepta peticiones de localhost y 127.0.0.1 en cualquier puerto', async () => {
  const app = createTestApp();
  await withServer(app, async (baseUrl) => {
    const resLocalhost = await fetch(`${baseUrl}/api/test`, {
      headers: { Origin: 'http://localhost:5500' }
    });
    assert.equal(resLocalhost.status, 200);
    assert.equal(resLocalhost.headers.get('access-control-allow-origin'), 'http://localhost:5500');

    const res127 = await fetch(`${baseUrl}/api/test`, {
      headers: { Origin: 'http://127.0.0.1:4200' }
    });
    assert.equal(res127.status, 200);
    assert.equal(res127.headers.get('access-control-allow-origin'), 'http://127.0.0.1:4200');
  });
});

test('CORS - No añade Access-Control-Allow-Origin en orígenes no autorizados y no arroja error 500', async () => {
  const app = createTestApp();
  await withServer(app, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/test`, {
      headers: { Origin: 'https://sitio-malicioso.com' }
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), null);
  });
});
