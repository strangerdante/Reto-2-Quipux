const { safeSegment } = require('../infrastructure/file-store');

class ManifestRepository {
  constructor(fileStore) {
    this.fileStore = fileStore;
  }

  tenantId(value) {
    return safeSegment(value, 'valle');
  }

  campaignId(value) {
    return safeSegment(value, 'default');
  }

  manifestDirectory(tenantId, campaignId) {
    return this.fileStore.path('resources', 'tenants', this.tenantId(tenantId), 'manifests', this.campaignId(campaignId));
  }

  manifestPath(tenantId, campaignId, filename) {
    return `${this.manifestDirectory(tenantId, campaignId)}/${filename}`;
  }

  auditPath(tenantId) {
    return this.fileStore.path('tenants', this.tenantId(tenantId), 'audit.json');
  }

  async withCampaignLock(tenantId, campaignId, operation) {
    const tenant = this.tenantId(tenantId);
    const campaign = this.campaignId(campaignId);
    return this.fileStore.runExclusive(`manifest:${tenant}:${campaign}`, operation);
  }

  async listVersionManifests(tenantId, campaignId) {
    const directory = this.manifestDirectory(tenantId, campaignId);
    const files = (await this.fileStore.readDirectory(directory)).filter(file => /^v\d+\.json$/.test(file));
    const manifests = await Promise.all(files.map(async file => ({
      filename: file,
      manifest: await this.fileStore.readJson(`${directory}/${file}`, null)
    })));
    return manifests.filter(entry => entry.manifest);
  }

  async getActive(tenantId, campaignId) {
    return this.fileStore.readJson(this.manifestPath(tenantId, campaignId, 'active.json'), null);
  }

  async getVersion(tenantId, campaignId, version) {
    return this.fileStore.readJson(this.manifestPath(tenantId, campaignId, `v${Number(version)}.json`), null);
  }

  async nextVersion(tenantId, campaignId) {
    const manifests = await this.listVersionManifests(tenantId, campaignId);
    return manifests.reduce((max, entry) => Math.max(max, Number(entry.manifest.version) || Number(entry.filename.match(/\d+/)?.[0]) || 0), 0) + 1;
  }

  async writeRelease(tenantId, campaignId, manifest) {
    const version = Number(manifest.version);
    await this.fileStore.writeJsonAtomic(this.manifestPath(tenantId, campaignId, `v${version}.json`), manifest);
    await this.fileStore.writeJsonAtomic(this.manifestPath(tenantId, campaignId, 'active.json'), manifest);
  }

  async listAudit(tenantId) {
    return this.fileStore.readJson(this.auditPath(tenantId), []);
  }

  async appendAudit(tenantId, entry) {
    const tenant = this.tenantId(tenantId);
    return this.fileStore.runExclusive(`audit:${tenant}`, async () => {
      const audit = await this.listAudit(tenant);
      const record = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        formattedTime: new Date().toLocaleString('es-CO'),
        ...entry
      };
      audit.unshift(record);
      await this.fileStore.writeJsonAtomic(this.auditPath(tenant), audit);
      return record;
    });
  }
}

module.exports = { ManifestRepository };
