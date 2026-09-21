const { safeSegment } = require('../infrastructure/file-store');

const DEFAULT_TENANTS = [
  {
    id: 'valle',
    name: 'Gobernación del Valle (Impuestos)',
    portalUrl: 'https://impuestos.valledelcauca.gov.co',
    logoUrl: '/brand/logos/valle.svg'
  },
  {
    id: 'medellin',
    name: 'Movilidad Medellín',
    portalUrl: 'https://www.medellin.gov.co/movilidad',
    logoUrl: '/brand/logos/medellin.svg'
  },
  {
    id: 'cali',
    name: 'Tránsito Cali',
    portalUrl: 'https://www.cali.gov.co/movilidad',
    logoUrl: '/brand/logos/cali.svg'
  }
];

class TenantRepository {
  constructor(fileStore) {
    this.fileStore = fileStore;
  }

  filePath() {
    return this.fileStore.path('tenants', 'registry.json');
  }

  async list() {
    const list = await this.fileStore.readJson(this.filePath(), null);
    if (!list || !Array.isArray(list) || list.length === 0) {
      await this.fileStore.writeJsonAtomic(this.filePath(), DEFAULT_TENANTS);
      return DEFAULT_TENANTS;
    }
    return list;
  }

  async find(id) {
    const tenants = await this.list();
    const cleanId = safeSegment(id, '');
    return tenants.find(t => t.id === cleanId) || null;
  }

  async create(tenantData) {
    const cleanId = safeSegment(tenantData.id || tenantData.name, '').toLowerCase();
    if (!cleanId) {
      throw new Error('Identificador de portal (id) inválido');
    }

    return this.fileStore.runExclusive('tenants:registry', async () => {
      const tenants = await this.list();
      const existing = tenants.find(t => t.id === cleanId);
      if (existing) {
        throw new Error(`El portal con identificador "${cleanId}" ya se encuentra registrado`);
      }

      const newTenant = {
        id: cleanId,
        name: String(tenantData.name || cleanId).trim(),
        portalUrl: String(tenantData.portalUrl || '').trim() || 'https://www.quipux.com',
        logoUrl: tenantData.logoUrl ? String(tenantData.logoUrl).trim() : undefined,
        createdAt: new Date().toISOString()
      };

      // Garantizar la creación de directorios físicos en el CDN
      await this.fileStore.ensureDirectory(this.fileStore.path('resources', 'tenants', cleanId, 'assets', 'desktop'));
      await this.fileStore.ensureDirectory(this.fileStore.path('resources', 'tenants', cleanId, 'assets', 'mobile'));
      await this.fileStore.ensureDirectory(this.fileStore.path('resources', 'tenants', cleanId, 'manifests'));
      await this.fileStore.ensureDirectory(this.fileStore.path('tenants', cleanId));

      const updated = [...tenants, newTenant];
      await this.fileStore.writeJsonAtomic(this.filePath(), updated);
      return newTenant;
    });
  }
}

module.exports = { TenantRepository, DEFAULT_TENANTS };
