    // 1. Inicialización de dataLayer global
    window.dataLayer = window.dataLayer || [];
    let eventCounter = 0;
    document.getElementById('initTime').textContent = new Date().toLocaleTimeString();

    const originalPush = window.dataLayer.push;
    window.dataLayer.push = function(...args) {
      const result = originalPush.apply(this, args);
      args.forEach(item => {
        if (item && item.event) {
          logDataLayerEvent(item);
        }
      });
      return result;
    };

    function logDataLayerEvent(payload) {
      eventCounter++;
      document.getElementById('eventCount').textContent = eventCounter;

      const hudBody = document.getElementById('hudBody');
      const entry = document.createElement('div');
      entry.className = 'log-entry';

      const serialized = JSON.stringify(payload);
      let borderColor = '#61C7D0';
      if (payload.event === 'quipux_modal_impression') borderColor = '#2E13F5';
      else if (payload.event === 'quipux_modal_cta_click') borderColor = '#5DC99A';
      else if (payload.event === 'quipux_modal_close') borderColor = '#F59E0B';
      else if (payload.event === 'quipux_modal_suppressed') {
        borderColor = '#EF4444';
        showToast(`ℹ️ Regla: ${payload.reason || 'Modal no mostrado en esta pantalla'}`);
      }

      entry.style.borderLeftColor = borderColor;
      entry.innerHTML = `
        <div class="log-header">
          <span class="log-event">${payload.event}</span>
          <span class="log-time">${new Date().toLocaleTimeString()}</span>
        </div>
        <div class="log-data" title='${serialized.replace(/'/g, "&apos;")}' onclick="toggleExpandLog(this)">${serialized}</div>
      `;
      hudBody.insertBefore(entry, hudBody.firstChild);
    }

    function toggleExpandLog(el) {
      el.style.whiteSpace = el.style.whiteSpace === 'normal' ? 'nowrap' : 'normal';
    }

    function toggleHud() {
      const container = document.getElementById('hudContainer');
      const icon = document.getElementById('toggleHudIcon');
      container.classList.toggle('minimized');
      icon.textContent = container.classList.contains('minimized') ? '▲' : '▼';
    }

    function toggleHudClick(event) {
      if (event) event.stopPropagation();
      toggleHud();
    }

    // =========================================================================
    // HUD DRAGGABLE & REUBICACIÓN LIBRE
    // =========================================================================
    const hudContainer = document.getElementById('hudContainer');
    const hudHeader = document.getElementById('hudHeader');

    let isHudDragging = false;
    let dragStartX = 0, dragStartY = 0;
    let initialHudLeft = 0, initialHudTop = 0;
    let totalDragDistance = 0;

    function restoreSavedHudPosition() {
      const savedX = sessionStorage.getItem('qpux_hud_x');
      const savedY = sessionStorage.getItem('qpux_hud_y');
      if (savedX !== null && savedY !== null) {
        const x = Math.max(10, Math.min(window.innerWidth - hudContainer.offsetWidth - 10, parseInt(savedX, 10)));
        const y = Math.max(45, Math.min(window.innerHeight - hudContainer.offsetHeight - 10, parseInt(savedY, 10)));
        hudContainer.style.left = x + 'px';
        hudContainer.style.top = y + 'px';
        hudContainer.style.right = 'auto';
        hudContainer.style.bottom = 'auto';
      }
    }

    // Eventos de arrastre con mouse y pantallas táctiles
    if (hudHeader) {
      hudHeader.addEventListener('mousedown', onHudStartDrag);
      hudHeader.addEventListener('touchstart', onHudStartDrag, { passive: true });
    }

    function onHudStartDrag(e) {
      if (e.target.closest('button') || e.target.closest('.hud-btn-icon')) return;

      isHudDragging = true;
      totalDragDistance = 0;
      hudContainer.classList.add('is-dragging');

      const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

      dragStartX = clientX;
      dragStartY = clientY;

      const rect = hudContainer.getBoundingClientRect();
      initialHudLeft = rect.left;
      initialHudTop = rect.top;

      document.addEventListener('mousemove', onHudMoveDrag);
      document.addEventListener('mouseup', onHudEndDrag);
      document.addEventListener('touchmove', onHudMoveDrag, { passive: false });
      document.addEventListener('touchend', onHudEndDrag);
    }

    function onHudMoveDrag(e) {
      if (!isHudDragging) return;
      if (e.cancelable && e.type.startsWith('touch')) e.preventDefault();

      const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - dragStartX;
      const deltaY = clientY - dragStartY;
      totalDragDistance = Math.hypot(deltaX, deltaY);

      let newLeft = initialHudLeft + deltaX;
      let newTop = initialHudTop + deltaY;

      const maxLeft = window.innerWidth - hudContainer.offsetWidth - 10;
      const maxTop = window.innerHeight - hudContainer.offsetHeight - 10;

      newLeft = Math.max(10, Math.min(maxLeft, newLeft));
      newTop = Math.max(45, Math.min(maxTop, newTop)); // 45px para respetar la barra superior

      hudContainer.style.left = newLeft + 'px';
      hudContainer.style.top = newTop + 'px';
      hudContainer.style.right = 'auto';
      hudContainer.style.bottom = 'auto';
    }

    function onHudEndDrag() {
      if (!isHudDragging) return;
      isHudDragging = false;
      hudContainer.classList.remove('is-dragging');

      document.removeEventListener('mousemove', onHudMoveDrag);
      document.removeEventListener('mouseup', onHudEndDrag);
      document.removeEventListener('touchmove', onHudMoveDrag);
      document.removeEventListener('touchend', onHudEndDrag);

      // Si fue solo un clic leve (< 5px), toggle minimize
      if (totalDragDistance < 5) {
        toggleHud();
      } else {
        // Guardar coordenadas de arrastre libre
        const rect = hudContainer.getBoundingClientRect();
        sessionStorage.setItem('qpux_hud_x', Math.round(rect.left));
        sessionStorage.setItem('qpux_hud_y', Math.round(rect.top));
      }
    }

    // Inicializar posición persistida
    setTimeout(restoreSavedHudPosition, 60);

    function clearDataLayerLogs(event) {
      if (event) event.stopPropagation();
      document.getElementById('hudBody').innerHTML = `
        <div class="log-entry" style="border-left-color: #64748B;">
          <div class="log-header">
            <span class="log-event">HISTORIAL LIMPIO</span>
            <span class="log-time">${new Date().toLocaleTimeString()}</span>
          </div>
          <div class="log-data">Inspector reiniciado.</div>
        </div>
      `;
      eventCounter = 0;
      document.getElementById('eventCount').textContent = '0';
      showToast('🧹 Consola dataLayer vaciada');
    }

    function showToast(msg) {
      const toast = document.getElementById('demoToast');
      toast.textContent = msg;
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 3500);
    }

    // 2. Diccionario de Identidad Visual y Configuración por Tenant
    const TENANT_THEMES = {
      valle: {
        cssClass: 'tenant-valle',
        name: 'Gobernación del Valle del Cauca',
        subtitle: 'Secretaría de Hacienda y Crédito Público · Impuesto sobre Vehículos Automotores',
        region: '🇨🇴 Valle del Cauca',
        badge: 'V',
        logo: '/portal-demo/assets/logos/valle.svg',
        phone: '01 8000 955 000 | (602) 620 0000',
        hours: 'Lunes a Viernes 7:30 a.m. - 5:00 p.m.',
        address: 'Palacio de San Francisco, Carrera 6 entre Calles 9 y 10, Cali · Valle del Cauca',
        defaultCamp: 'camp-1',
        heroHeading: 'Consulte y Pague el Impuesto Vehicular del Valle del Cauca',
        heroDesc: 'Aproveche el 15% de descuento por pronto pago para la vigencia 2026. Realice su trámite de forma ágil, segura y sin intermediarios.',
        departmentName: 'Valle del Cauca'
      },
      medellin: {
        cssClass: 'tenant-medellin',
        name: 'Alcaldía de Medellín',
        subtitle: 'Secretaría de Movilidad y Hacienda Distrital · Tránsito y Comparendos',
        region: '🇨🇴 Medellín · Antioquia',
        badge: 'M',
        logo: '/portal-demo/assets/logos/medellin.svg',
        phone: 'Línea 123 | (604) 445 7777',
        hours: 'Lunes a Viernes 7:30 a.m. - 5:30 p.m.',
        address: 'Centro Administrativo Distrital La Alpujarra, Calle 44 # 52-165, Medellín · Antioquia',
        defaultCamp: 'camp-med-1',
        heroHeading: 'Portal Oficial de Movilidad y Tránsito de Medellín',
        heroDesc: 'Consulte comparendos con 50% de descuento por curso vial pedagógico, rotación de Pico y Placa y liquidación de derechos de tránsito.',
        departmentName: 'Medellín'
      },
      cali: {
        cssClass: 'tenant-cali',
        name: 'Alcaldía de Santiago de Cali',
        subtitle: 'Secretaría de Movilidad Distrital · Trámites y Recaudo Unificado',
        region: '🇨🇴 Santiago de Cali · Distrito Especial',
        badge: 'C',
        logo: '/portal-demo/assets/logos/cali.svg',
        phone: 'Línea 195 | (602) 445 9000',
        hours: 'Lunes a Viernes 8:00 a.m. - 5:00 p.m. jornada continua',
        address: 'CAM - Centro Administrativo Municipal, Av. 2 Norte # 10-70, Torre Alcaldía, Cali',
        defaultCamp: 'camp-cali-1',
        heroHeading: 'Servicios de Movilidad y Tránsito Santiago de Cali',
        heroDesc: 'Liquide derechos de tránsito, consulte facilidades de pago sin intereses moratorios y gestione trámites vehiculares en línea.',
        departmentName: 'Santiago de Cali'
      }
    };

    // 3. Obtención y aplicación de parámetros de URL
    const params = new URLSearchParams(window.location.search);
    const rawTenant = params.get('tenant') || 'valle';
    const currentTenant = TENANT_THEMES[rawTenant] ? rawTenant : 'valle';
    const theme = TENANT_THEMES[currentTenant];
    const currentCampaign = params.get('campaign') || theme.defaultCamp;

    // Aplicar clase CSS temática
    document.body.className = theme.cssClass;

    // Actualizar encabezados y controles
    document.getElementById('tenantPicker').value = currentTenant;
    const campSelect = document.getElementById('campaignPicker');
    async function populateCampaigns() {
      if (!campSelect) return;
      try {
        const res = await fetch(`/api/campaigns?tenant=${encodeURIComponent(currentTenant)}`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            campSelect.innerHTML = list.map(c => 
              `<option value="${c.id}" ${c.id === currentCampaign ? 'selected' : ''}>${c.name} (${c.version || 'v1'})</option>`
            ).join('');
            if (!list.some(c => c.id === currentCampaign) && currentCampaign) {
              const opt = document.createElement('option');
              opt.value = currentCampaign;
              opt.textContent = `ID: ${currentCampaign}`;
              opt.selected = true;
              campSelect.appendChild(opt);
            }
          }
        }
      } catch (e) {
        console.warn('Error cargando catálogo de campañas en portal:', e);
      }
    }
    populateCampaigns();

    document.getElementById('tenantLogoImg').src = theme.logo;
    document.getElementById('tenantTitle').textContent = theme.name;
    document.getElementById('tenantSubtitle').textContent = theme.subtitle;
    document.getElementById('tenantRegionTag').textContent = theme.region;
    document.getElementById('tenantPhone').textContent = theme.phone;
    document.getElementById('tenantHours').textContent = theme.hours;

    document.getElementById('footerLogoImg').src = theme.logo;
    document.getElementById('footerEntityName').textContent = theme.name;
    document.getElementById('footerEntityAddress').textContent = theme.address;
    document.getElementById('footerPhone').textContent = theme.phone.split('|')[0].trim();

    // 4. Renderizado dinámico de Vistas por Ruta
    function renderRoute(route) {
      const container = document.getElementById('pageViewContainer');
      document.getElementById('activeRouteDisplay').textContent = route;

      // Actualizar estilo de enlaces activos en nav
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      if (route === '/') document.getElementById('nav-root')?.classList.add('active');
      else if (route.startsWith('/tramites')) document.getElementById('nav-tramites')?.classList.add('active');
      else if (route.startsWith('/liquidaciones')) document.getElementById('nav-liquidaciones')?.classList.add('active');

      if (route === '/') {
        // VISTA INICIO
        container.innerHTML = `
          <!-- HERO EQUILIBRADO -->
          <section class="hero-box">
            <div class="hero-content">
              <span class="hero-tag">VIGENCIA FISCAL 2026</span>
              <h2>${theme.heroHeading}</h2>
              <p>${theme.heroDesc}</p>
            </div>
            <div class="search-card">
              <div class="search-card-title">
                <span>Consulta de Liquidación</span>
                <span>100% Digital</span>
              </div>
              <div class="search-card-input-group">
                <input type="text" placeholder="Ej. ABC123" maxlength="6" id="inputPlaca" value="QPX2026" />
                <button onclick="consultarPlaca()">Consultar</button>
              </div>
              <div class="search-card-footer">
                <span>🔒 Cifrado SSL 256-bit</span>
                <span>💳 Recaudo Oficial Quipux</span>
              </div>
            </div>
          </section>

          <!-- CIFRAS EN VIVO -->
          <div class="metrics-row">
            <div class="metric-item">
              <div class="metric-value">+380.000</div>
              <div class="metric-text">Trámites atendidos en 2026</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">15% Dto.</div>
              <div class="metric-text">Pronto pago hasta 30 de abril</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">100% Digital</div>
              <div class="metric-text">Sin filas ni tramitadores</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">99.9% Uptime</div>
              <div class="metric-text">Disponibilidad de plataforma</div>
            </div>
          </div>

          <!-- TRÁMITES DESTACADOS -->
          <div class="section-title-wrap">
            <div>
              <h3>Trámites y Servicios Destacados</h3>
              <p>Seleccione el trámite que requiere consultar o gestionar en línea</p>
            </div>
          </div>

          <div class="services-grid">
            <div class="service-card" onclick="navigate('/tramites/impuesto-vehicular')">
              <img class="service-card-image" src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80" alt="Vehículo" />
              <div class="service-card-body">
                <span class="service-card-tag">Tributario</span>
                <h4>Liquidación de Impuesto Vehicular</h4>
                <p>Calcule en segundos el avalúo oficial según tablas del Ministerio de Transporte y genere su recibo de pago.</p>
                <div class="service-card-link">Iniciar trámite →</div>
              </div>
            </div>

            <div class="service-card" onclick="navigate('/liquidaciones/descuentos')">
              <img class="service-card-image" src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80" alt="Descuentos" />
              <div class="service-card-body">
                <span class="service-card-tag">Beneficios</span>
                <h4>Calendario y Descuentos 2026</h4>
                <p>Consulte las fechas límites de pago sin sanciones y acceda hasta el 15% de descuento por pronto pago.</p>
                <div class="service-card-link">Ver calendario →</div>
              </div>
            </div>
          </div>

          <!-- NOTICIAS OFICIALES -->
          <div class="section-title-wrap">
            <div>
              <h3>Avisos Oficiales y Noticias de Movilidad</h3>
              <p>Información de interés general para propietarios de vehículos y conductores</p>
            </div>
          </div>

          <div class="news-grid">
            <div class="news-card" onclick="navigate('/tramites/impuesto-vehicular')">
              <img src="https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=400&q=80" alt="Pico y placa" />
              <div class="news-card-content">
                <h5>Rotación de Pico y Placa primer semestre</h5>
                <p>Conozca la restricción de dígitos aplicable para el área metropolitana de ${theme.departmentName}.</p>
              </div>
            </div>

            <div class="news-card" onclick="navigate('/liquidaciones/descuentos')">
              <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=400&q=80" alt="Curso vial" />
              <div class="news-card-content">
                <h5>50% de descuento por curso pedagógico</h5>
                <p>Capacitación en seguridad vial para acceder a rebaja en multas de tránsito notificadas.</p>
              </div>
            </div>

            <div class="news-card" onclick="navigate('/tramites/impuesto-vehicular')">
              <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80" alt="Fotodetección" />
              <div class="news-card-content">
                <h5>Paz y Salvo digital automático</h5>
                <p>Al liquidar su impuesto en línea, el paz y salvo se expide y valida de inmediato en el RUNT.</p>
              </div>
            </div>
          </div>
        `;
      } else if (route.startsWith('/tramites')) {
        // VISTA TRÁMITES DE IMPUESTO
        container.innerHTML = `
          <div class="content-panel">
            <div class="content-panel-header">
              <h2>Liquidación Oficial de Impuesto Vehicular — Vigencia 2026</h2>
              <p>${theme.name} · Sistema Departamental de Gestión Tributaria y Movilidad</p>
            </div>

            <div class="form-grid" style="margin-bottom: 24px;">
              <div class="form-group">
                <label>Placa del Vehículo</label>
                <input type="text" id="tramitePlaca" value="QPX2026" maxlength="6" />
              </div>
              <div class="form-group">
                <label>Documento de Identidad del Propietario</label>
                <input type="text" id="tramiteDoc" placeholder="Ej. 111222333" value="111222333" />
              </div>
              <div class="form-group">
                <label>Tipo de Vehículo</label>
                <select>
                  <option selected>Automóvil / Camioneta particular</option>
                  <option>Motocicleta (más de 125 c.c.)</option>
                  <option>Vehículo de Carga / Pasajeros</option>
                </select>
              </div>
              <div class="form-group">
                <label>Municipio de Registro</label>
                <select>
                  <option selected>${theme.departmentName}</option>
                  <option>Otro municipio del departamento</option>
                </select>
              </div>
            </div>

            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h4 style="font-size: 14px; font-weight: 800; margin-bottom: 12px; color: var(--text-main);">Resumen de Avalúo MinTransporte 2026</h4>
              <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
                <span>Avalúo fiscal certificado:</span>
                <strong>$ 48.500.000 COP</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
                <span>Tarifa aplicable (1.5%):</span>
                <strong>$ 727.500 COP</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #065F46;">
                <span>Descuento pronto pago (15% hasta 30 de abril):</span>
                <strong>- $ 109.125 COP</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; border-top: 1px solid #E2E8F0; padding-top: 10px; margin-top: 10px; color: var(--tenant-primary);">
                <span>Total a Pagar:</span>
                <span>$ 618.375 COP</span>
              </div>
            </div>

            <div style="display: flex; gap: 12px;">
              <button class="btn-primary" onclick="showToast('💳 Generando recibo oficial con código de barras y botón de pago...')">
                💳 Liquidar y Pagar
              </button>
              <button class="btn-tool" style="background:#FFFFFF; color:#334155; border-color:#CBD5E1; padding: 12px 20px;" onclick="showToast('📄 Descargando formulario oficial en PDF...')">
                🖨️ Descargar Declaración PDF
              </button>
            </div>
          </div>
        `;
      } else if (route.startsWith('/liquidaciones')) {
        // VISTA DESCUENTOS Y CALENDARIO
        container.innerHTML = `
          <div class="content-panel">
            <div class="content-panel-header">
              <h2>Calendario Tributario y Descuentos por Pronto Pago 2026</h2>
              <p>Fechas de vencimiento para la liquidación oportuna sin sanciones ni intereses moratorios</p>
            </div>

            <table class="clean-table" style="margin-bottom: 28px;">
              <thead>
                <tr>
                  <th>Periodo de Pago</th>
                  <th>Beneficio Otorgado</th>
                  <th>Plazo Límite</th>
                  <th>Estado Actual</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Pronto Pago Fase 1</strong></td>
                  <td><span class="table-badge success">15% de Descuento</span></td>
                  <td>Hasta el 30 de Abril de 2026</td>
                  <td><span style="color: #065F46; font-weight: 700;">● Vigente hoy</span></td>
                </tr>
                <tr>
                  <td><strong>Pronto Pago Fase 2</strong></td>
                  <td><span class="table-badge warning">10% de Descuento</span></td>
                  <td>1 de Mayo al 31 de Mayo de 2026</td>
                  <td><span>Próximo periodo</span></td>
                </tr>
                <tr>
                  <td><strong>Pago Oportuno Ordinario</strong></td>
                  <td><span class="table-badge neutral">Tarifa Plena (Sin sanción)</span></td>
                  <td>1 de Junio al 30 de Junio de 2026</td>
                  <td><span>Programado</span></td>
                </tr>
                <tr>
                  <td><strong>Periodo Extemporáneo</strong></td>
                  <td>Aplica sanción mínima + Intereses DIAN</td>
                  <td>A partir del 1 de Julio de 2026</td>
                  <td><span style="color: #DC2626;">Con recargos</span></td>
                </tr>
              </tbody>
            </table>

            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px;">
              <h4 style="font-size: 14px; font-weight: 800; margin-bottom: 8px;">¿Tiene vigencias anteriores en mora?</h4>
              <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px;">
                ${theme.name} cuenta con planes de facilidades de pago diferidos hasta en 24 cuotas sin cobro coactivo.
              </p>
              <button class="btn-primary" onclick="showToast('📋 Solicitud de acuerdo de pago recibida')">
                Solicitar Acuerdo de Pago en Línea
              </button>
            </div>
          </div>
        `;
      } else {
        // Fallback para rutas no encontradas
        container.innerHTML = `
          <div class="content-panel" style="text-align: center; padding: 48px 24px;">
            <h2>Página no disponible</h2>
            <p style="margin: 12px 0 24px 0; color: var(--text-muted);">La sección solicitada no está disponible o ha sido reubicada.</p>
            <button class="btn-primary" onclick="navigate('/')">← Volver al Inicio</button>
          </div>
        `;
      }
    }

    // Navegación SPA reactiva
    function navigate(route) {
      const campParam = currentCampaign ? `&campaign=${encodeURIComponent(currentCampaign)}` : '';
      const fullPath = route === '/' ? `/portal-demo/?tenant=${encodeURIComponent(currentTenant)}${campParam}` : `/portal-demo${route}?tenant=${encodeURIComponent(currentTenant)}${campParam}`;
      history.pushState({}, '', fullPath);
      renderRoute(route);
      showToast(`Navegación SPA a: ${route}`);
    }

    // Selector de Tenant
    function changeTenant(tenant) {
      const tTheme = TENANT_THEMES[tenant] || TENANT_THEMES['valle'];
      window.location.href = `/portal-demo/?tenant=${encodeURIComponent(tenant)}&campaign=${encodeURIComponent(tTheme.defaultCamp)}`;
    }

    // Selector de Campaña (AC-12)
    function changeCampaign(campaignId) {
      const cleanCamp = campaignId ? encodeURIComponent(campaignId.trim()) : '';
      window.location.href = `/portal-demo/?tenant=${encodeURIComponent(currentTenant)}${cleanCamp ? '&campaign=' + cleanCamp : ''}`;
    }

    // Prueba de Doble Inyección (Idempotencia AC-16)
    function testDoubleInjection() {
      console.log('🧪 Probando AC-16: Inyectando segundo script idéntico en el DOM...');
      const script2 = document.createElement('script');
      script2.async = true;
      script2.src = '/resources/runtime/quipux-popup-runtime.js?v=' + Date.now();
      script2.setAttribute('data-tenant', currentTenant);
      script2.setAttribute('data-campaign', currentCampaign);
      document.head.appendChild(script2);

      setTimeout(() => {
        const modals = document.querySelectorAll('quipux-popup-studio');
        showToast(`✅ AC-16 Idempotencia verificada: Solo ${modals.length} modal activo en DOM.`);
      }, 300);
    }

    // Resetear almacenamiento local y de sesión
    function clearStorageAndReload() {
      sessionStorage.clear();
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('qpux_popup_') || key.startsWith('quipux_popup_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      localStorage.removeItem('qpux_popup_camp-1_viewed');
      localStorage.removeItem('qpux_popup_camp-med-1_viewed');
      localStorage.removeItem(`quipux_popup_${currentTenant}_${currentCampaign}`);

      showToast('🧹 Frecuencia reseteada. Recargando portal...');
      setTimeout(() => {
        window.location.href = `/portal-demo/?tenant=${encodeURIComponent(currentTenant)}&campaign=${encodeURIComponent(currentCampaign)}`;
      }, 500);
    }

    function inspectActiveManifest() {
      const url = `/resources/tenants/${encodeURIComponent(currentTenant)}/manifests/${encodeURIComponent(currentCampaign)}/active.json`;
      window.open(url, '_blank');
    }

    function consultarPlaca() {
      const input = document.getElementById('inputPlaca');
      const placa = input ? input.value : 'QPX2026';
      showToast(`🔍 Consultando liquidación para vehículo ${placa}...`);
      setTimeout(() => navigate('/tramites/impuesto-vehicular'), 600);
    }

    // Renderizar la ruta inicial según el pathname actual
    const currentPath = window.location.pathname.replace(/^\/portal-demo/, '') || '/';
    renderRoute(currentPath);

    const studioBtn = document.getElementById('linkQuipuxStudio');
    if (studioBtn) {
      studioBtn.href = window.__QUIPUX_STUDIO_URL__ || `${window.location.protocol}//${window.location.hostname || 'localhost'}:4200`;
    }

// Exposición global para el cargador de runtime y diagnósticos
window.currentTenant = currentTenant;
window.currentCampaign = currentCampaign;
