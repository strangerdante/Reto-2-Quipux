const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs/promises');
const { FileStore } = require('../infrastructure/file-store');
const { TenantRepository, DEFAULT_TENANTS } = require('../repositories/tenant-repository');

test('TenantRepository - list() inicializa con defaults si no existe', async () => {
  const tempDir = path.join(__dirname, 'temp-tenant-test-' + Date.now());
  const fileStore = new FileStore(tempDir);
  const repo = new TenantRepository(fileStore);

  try {
    const list = await repo.list();
    assert.equal(list.length, DEFAULT_TENANTS.length);
    assert.equal(list[0].id, 'valle');

    const found = await repo.find('valle');
    assert.ok(found);
    assert.equal(found.name, 'Gobernación del Valle (Impuestos)');
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test('TenantRepository - create() registra nuevo tenant y crea carpetas CDN', async () => {
  const tempDir = path.join(__dirname, 'temp-tenant-test-' + Date.now());
  const fileStore = new FileStore(tempDir);
  const repo = new TenantRepository(fileStore);

  try {
    const newTenant = await repo.create({
      id: 'bucaramanga',
      name: 'Alcaldía de Bucaramanga',
      portalUrl: 'https://bucaramanga.gov.co'
    });

    assert.equal(newTenant.id, 'bucaramanga');
    assert.equal(newTenant.name, 'Alcaldía de Bucaramanga');

    const existsDesktop = await fileStore.exists(fileStore.path('resources', 'tenants', 'bucaramanga', 'assets', 'desktop'));
    const existsMobile = await fileStore.exists(fileStore.path('resources', 'tenants', 'bucaramanga', 'assets', 'mobile'));
    const existsManifests = await fileStore.exists(fileStore.path('resources', 'tenants', 'bucaramanga', 'manifests'));

    assert.equal(existsDesktop, true);
    assert.equal(existsMobile, true);
    assert.equal(existsManifests, true);

    // Validar error en duplicado
    await assert.rejects(async () => {
      await repo.create({ id: 'bucaramanga', name: 'Duplicado' });
    }, /ya se encuentra registrado/);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
