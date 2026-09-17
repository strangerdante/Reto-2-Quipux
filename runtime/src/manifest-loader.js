// Submódulo: Carga y Caché de Manifiestos Multitenant
export class ManifestLoader {
  constructor(baseUrl) {
    if (baseUrl) {
      this.baseUrl = baseUrl;
    } else if (typeof window !== 'undefined' && window.__QUIPUX_CDN_URL__) {
      this.baseUrl = window.__QUIPUX_CDN_URL__;
    } else if (typeof window !== 'undefined' && window.location && window.location.port === '3000') {
      this.baseUrl = `${window.location.origin}/resources/tenants`;
    } else {
      this.baseUrl = 'http://localhost:3000/resources/tenants';
    }
  }

  async fetchActiveManifest(tenantId, campaignId = 'camp-1') {
    const url = `${this.baseUrl}/${tenantId}/manifests/${campaignId}/active.json?t=${Date.now()}`;
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener manifest de ${url}`);
      }
      return await response.json();
    } catch (err) {
      console.warn('[Quipux ManifestLoader] Error cargando manifest activo:', err.message);
      return null;
    }
  }
}
