// Submódulo: Despacho de Eventos Analíticos Limpios a GTM dataLayer (AC-21)
export class DataLayerDispatcher {
  static dispatch(eventName, modalMetadata) {
    if (typeof window === 'undefined') return;

    window.dataLayer = window.dataLayer || [];

    // Limpieza y sanitización de datos personales (PII)
    const sanitizedMetadata = this.sanitizePayload(modalMetadata);

    const eventPayload = {
      event: eventName,
      modal: sanitizedMetadata
    };

    window.dataLayer.push(eventPayload);

    // Evento personalizado nativo en DOM para herramientas de testing o HUD
    try {
      window.dispatchEvent(new CustomEvent('quipux:datalayer', { detail: eventPayload }));
    } catch (e) {}

    console.info(`[Quipux GTM] Evento despachado: %c${eventName}`, 'color: #2E13F5; font-weight: bold;', sanitizedMetadata);
  }

  static sanitizePayload(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const clean = {};
    const piiKeys = ['name', 'email', 'phone', 'cedula', 'documento', 'placa', 'user', 'password'];

    for (const [k, v] of Object.entries(obj)) {
      if (piiKeys.includes(k.toLowerCase())) {
        continue; // Excluir campos con posibles nombres personales
      }
      if (typeof v === 'string' && v.includes('@')) {
        continue; // Excluir posibles emails
      }
      clean[k] = v;
    }
    return clean;
  }
}
