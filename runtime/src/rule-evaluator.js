// Submódulo: Evaluación de Reglas de Negocio en Runtime (AC-09, AC-17)
export class RuleEvaluator {
  static evaluate(rules, campaignId, currentPath = (typeof window !== 'undefined' ? window.location.pathname : '/')) {
    if (!rules) return { canShow: true, code: 'NO_RULES', reason: 'Sin restricciones configuradas.' };

    const now = Date.now();

    // 1. Evaluación de vigencia temporal (fechas inicio/fin ISO)
    if (rules.startDate) {
      const start = new Date(rules.startDate).getTime();
      if (!isNaN(start) && now < start) {
        return {
          canShow: false,
          code: 'FUTURE_START',
          reason: `Vigencia futura: Inicia el ${new Date(start).toLocaleString('es-CO')} (${rules.startDate}). Actualmente fuera de horario.`
        };
      }
    }
    if (rules.endDate) {
      const end = new Date(rules.endDate).getTime();
      if (!isNaN(end) && now > end) {
        return {
          canShow: false,
          code: 'EXPIRED',
          reason: `Vigencia expirada: Venció el ${new Date(end).toLocaleString('es-CO')} (${rules.endDate}).`
        };
      }
    }

    // 2. Evaluación de frecuencia de visualización
    const freq = rules.frequency || 'once_per_session';
    const storageKey = `qpux_popup_${campaignId}_viewed`;

    if (freq === 'once_per_session' || freq === 'Una vez por sesión') {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(storageKey)) {
        return {
          canShow: false,
          code: 'SESSION_VIEWED',
          reason: `Frecuencia alcanzada: Ya se mostró en esta sesión (${freq}). Usa "Reset Frecuencia" para probar de nuevo.`
        };
      }
    } else if (freq === 'once_per_device' || freq === 'Una vez por día') {
      if (typeof localStorage !== 'undefined') {
        const lastView = localStorage.getItem(storageKey);
        if (lastView) {
          const diffHours = (now - parseInt(lastView, 10)) / (1000 * 60 * 60);
          if (diffHours < 24) {
            return {
              canShow: false,
              code: 'DEVICE_VIEWED',
              reason: `Frecuencia alcanzada: Ya se mostró en este dispositivo en las últimas 24h. Usa "Reset Frecuencia" para probar.`
            };
          }
        }
      }
    }

    // 3. Evaluación de coincidencia de ruta SPA (soporta rutas reales y entorno simulador /portal-demo)
    const pattern = rules.pathRule;
    if (pattern && pattern !== '*' && pattern !== '/*') {
      const regexStr = '^' + pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*') + '$';
      const regex = new RegExp(regexStr);
      const normalizedPath = currentPath.replace(/^\/portal-demo/, '') || '/';
      if (!regex.test(currentPath) && !regex.test(normalizedPath)) {
        return {
          canShow: false,
          code: 'ROUTE_MISMATCH',
          reason: `Ruta no coincide: La regla requiere "${pattern}", pero la ruta actual es "${currentPath}". Navega a la sección correspondiente.`
        };
      }
    }

    return { canShow: true, code: 'ELIGIBLE', reason: 'Cumple todas las reglas de aparición.' };
  }

  static shouldShow(rules, campaignId, currentPath = (typeof window !== 'undefined' ? window.location.pathname : '/')) {
    return this.evaluate(rules, campaignId, currentPath).canShow;
  }

  static recordView(rules, campaignId) {
    const freq = rules?.frequency || 'once_per_session';
    const storageKey = `qpux_popup_${campaignId}_viewed`;
    if (freq === 'once_per_session' || freq === 'Una vez por sesión') {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(storageKey, 'true');
      }
    } else if (freq === 'once_per_device' || freq === 'Una vez por día') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(storageKey, String(Date.now()));
      }
    }
  }
}
