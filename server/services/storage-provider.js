const path = require('path');
const { safeSegment } = require('../infrastructure/file-store');

class LocalStorageProvider {
  constructor({ fileStore, config }) {
    this.fileStore = fileStore;
    this.config = config;
  }

  normalizeTenant(tenantId) {
    return safeSegment(tenantId, 'valle');
  }

  normalizeTarget(targetType) {
    return targetType === 'mobile' ? 'mobile' : 'desktop';
  }

  assetDirectory(tenantId, targetType) {
    return this.fileStore.path('resources', 'tenants', this.normalizeTenant(tenantId), 'assets', this.normalizeTarget(targetType));
  }

  async saveAsset({ tenantId, targetType, filename, content }) {
    const tenant = this.normalizeTenant(tenantId);
    const target = this.normalizeTarget(targetType);
    const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    await this.fileStore.writeBuffer(`${this.assetDirectory(tenant, target)}/${safeFilename}`, content);
    return {
      tenant,
      target,
      filename: safeFilename,
      cdnPath: `resources/tenants/${tenant}/assets/${target}/${safeFilename}`,
      url: this.config.assetUrl(tenant, target, safeFilename)
    };
  }

  async listAssets(tenantId) {
    const tenant = this.normalizeTenant(tenantId);
    const entries = [];
    for (const target of ['desktop', 'mobile']) {
      const directory = this.assetDirectory(tenant, target);
      const filenames = await this.fileStore.readDirectory(directory);
      for (const filename of filenames) {
        const filePath = `${directory}/${filename}`;
        try {
          const stat = await this.fileStore.stat(filePath);
          if (!stat.isFile()) continue;
          entries.push({
            tenant,
            target,
            filename,
            sizeBytes: stat.size,
            buffer: await this.fileStore.readBuffer(filePath),
            cdnPath: `resources/tenants/${tenant}/assets/${target}/${filename}`,
            url: this.config.assetUrl(tenant, target, filename)
          });
        } catch {
          // The file may have been removed between directory listing and inspection.
        }
      }
    }
    return entries;
  }
}

module.exports = { LocalStorageProvider };
