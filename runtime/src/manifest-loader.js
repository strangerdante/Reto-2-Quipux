// Submódulo: Carga de manifiestos multitenant desde un CDN configurable.
export class ManifestLoader {
  constructor(cdnBaseUrl) {
    const defaultOrigin = (typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null')
      ? window.location.origin
      : 'http://localhost:3000';
    const configuredBaseUrl = cdnBaseUrl || window.__QUIPUX_RUNTIME_CONFIG__?.cdnBaseUrl || window.__QUIPUX_CDN_URL__ || defaultOrigin;
    const normalizedBaseUrl = String(configuredBaseUrl).replace(/\/+$/, '');
    this.tenantBaseUrl = normalizedBaseUrl.endsWith('/resources/tenants')
      ? normalizedBaseUrl
      : `${normalizedBaseUrl}/resources/tenants`;
  }

  buildUrl(tenantId, campaignId, manifestUrl) {
    const source = manifestUrl || `${this.tenantBaseUrl}/${encodeURIComponent(tenantId)}/manifests/${encodeURIComponent(campaignId)}/active.json`;
    const defaultOrigin = (typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null')
      ? window.location.origin
      : 'http://localhost:3000';
    const url = source.startsWith('http://') || source.startsWith('https://')
      ? new URL(source)
      : new URL(source, defaultOrigin);
    url.searchParams.set('t', String(Date.now()));
    return url.toString();
  }

  async fetchActiveManifest(tenantId, campaignId = 'camp-1', manifestUrl) {
    const url = this.buildUrl(tenantId, campaignId, manifestUrl);
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status} al obtener manifest de ${url}`);
      return await response.json();
    } catch (error) {
      console.warn('[Quipux ManifestLoader] Error cargando manifest activo:', error.message);
      return null;
    }
  }
}
