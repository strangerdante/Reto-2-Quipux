// Submódulo: Evaluación de Reglas de Negocio en Runtime (AC-09, AC-17)
export class RuleEvaluator {
  static shouldShow(rules, campaignId, currentPath = window.location.pathname) {
    if (!rules) return true;

    // 1. Evaluación de vigencia temporal (fechas inicio/fin ISO)
    const now = Date.now();
    if (rules.startDate) {
      const start = new Date(rules.startDate).getTime();
      if (!isNaN(start) && now < start) {
        return false; // Aún no inicia vigencia
      }
    }
    if (rules.endDate) {
      const end = new Date(rules.endDate).getTime();
      if (!isNaN(end) && now > end) {
        return false; // Vigencia expirada
      }
    }

    // 2. Evaluación de frecuencia de visualización
    const freq = rules.frequency || 'once_per_session';
    const storageKey = `qpux_popup_${campaignId}_viewed`;

    if (freq === 'once_per_session' || freq === 'Una vez por sesión') {
      if (sessionStorage.getItem(storageKey)) {
        return false;
      }
    } else if (freq === 'once_per_device' || freq === 'Una vez por día') {
      const lastView = localStorage.getItem(storageKey);
      if (lastView) {
        const diffHours = (now - parseInt(lastView, 10)) / (1000 * 60 * 60);
        if (diffHours < 24) {
          return false;
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
        return false; // No coincide con la ruta activa
      }
    }

    return true;
  }

  static recordView(rules, campaignId) {
    const freq = rules?.frequency || 'once_per_session';
    const storageKey = `qpux_popup_${campaignId}_viewed`;
    if (freq === 'once_per_session' || freq === 'Una vez por sesión') {
      sessionStorage.setItem(storageKey, 'true');
    } else if (freq === 'once_per_device' || freq === 'Una vez por día') {
      localStorage.setItem(storageKey, String(Date.now()));
    }
  }
}
