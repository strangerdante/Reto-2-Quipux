const path = require('path');

function withoutTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

const port = Number(process.env.PORT || 3000);
const publicBaseUrl = withoutTrailingSlash(process.env.PUBLIC_BASE_URL || `http://localhost:${port}`);
const cdnBaseUrl = withoutTrailingSlash(process.env.CDN_BASE_URL || publicBaseUrl);
const apiBaseUrl = withoutTrailingSlash(process.env.API_BASE_URL || `${publicBaseUrl}/api`);
const corsOrigins = (process.env.CORS_ORIGINS || `http://localhost:4200,${publicBaseUrl}`)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

function resourceUrl(resourcePath) {
  return `${cdnBaseUrl}/${String(resourcePath).replace(/^\/+/, '')}`;
}

module.exports = {
  port,
  apiBaseUrl,
  publicBaseUrl,
  cdnBaseUrl,
  corsOrigins,
  storageRoot: process.env.STORAGE_ROOT || path.join(__dirname, '..', 'storage'),
  resourceUrl,
  runtimeUrl: () => resourceUrl('resources/runtime/quipux-popup-runtime.js'),
  manifestUrl: (tenantId, campaignId) => resourceUrl(`resources/tenants/${tenantId}/manifests/${campaignId}/active.json`),
  assetUrl: (tenantId, targetType, filename) => resourceUrl(`resources/tenants/${tenantId}/assets/${targetType}/${filename}`)
};
