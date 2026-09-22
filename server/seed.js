const fs = require('fs');
const path = require('path');

const STORAGE_ROOT = path.join(__dirname, 'storage');

function createSvgPlaceholder(text, bgColor, textColor, width, height) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="${bgColor}"/>
    <circle cx="${width/2}" cy="${height/2 - 20}" r="${Math.min(width, height)/5}" fill="${textColor}" opacity="0.15"/>
    <text x="50%" y="${height/2 + 10}" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.max(16, width/22)}" font-weight="700" fill="${textColor}">
      ${text}
    </text>
    <text x="50%" y="${height/2 + 40}" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="${textColor}" opacity="0.8">
      ${width} × ${height} px · Quipux CDN
    </text>
  </svg>`;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function seed() {
  console.log('🌱 Inicializando datos semilla físicos en disco...');

  // 1. Tenant: VALLE DEL CAUCA
  const valleDir = path.join(STORAGE_ROOT, 'tenants', 'valle');
  const valleAssetsDesk = path.join(STORAGE_ROOT, 'resources', 'tenants', 'valle', 'assets', 'desktop');
  const valleAssetsMob = path.join(STORAGE_ROOT, 'resources', 'tenants', 'valle', 'assets', 'mobile');
  const valleManifestDir = path.join(STORAGE_ROOT, 'resources', 'tenants', 'valle', 'manifests', 'camp-1');

  ensureDir(valleDir);
  ensureDir(valleAssetsDesk);
  ensureDir(valleAssetsMob);
  ensureDir(valleManifestDir);

  // Imágenes para Valle
  fs.writeFileSync(path.join(valleAssetsDesk, 'cobro-coactivo-desk.png'), createSvgPlaceholder('Descuento Tributario 50%', '#211C33', '#61C7D0', 800, 560));
  fs.writeFileSync(path.join(valleAssetsMob, 'cobro-coactivo-mob.png'), createSvgPlaceholder('Descuento 50%', '#211C33', '#61C7D0', 420, 420));
  fs.writeFileSync(path.join(valleAssetsDesk, 'acuerdos-pago-desk.png'), createSvgPlaceholder('Acuerdos de Pago Flexibles', '#2E13F5', '#FFFFFF', 800, 560));
  fs.writeFileSync(path.join(valleAssetsMob, 'acuerdos-pago-mob.png'), createSvgPlaceholder('Acuerdos de Pago', '#2E13F5', '#FFFFFF', 420, 420));
  fs.writeFileSync(path.join(valleAssetsDesk, 'pago-en-linea-desk.png'), createSvgPlaceholder('Pago Virtual PSE y Tarjetas', '#5DC99A', '#211C33', 800, 560));
  fs.writeFileSync(path.join(valleAssetsMob, 'pago-en-linea-mob.png'), createSvgPlaceholder('Pago Virtual PSE', '#5DC99A', '#211C33', 420, 420));

  const valleCampaigns = [
    {
      id: 'camp-1',
      name: 'Cobro Coactivo 2026',
      type: 'Modal con slider',
      tenant: 'valle',
      status: 'Publicado',
      version: 'v1',
      updated: '17 sep 2026',
      layout: 'side',
      rules: {
        delay: 1.5,
        frequency: 'Una vez por sesión',
        pathRule: '*',
        startDate: '2026-09-01T00:00:00.000Z',
        endDate: '2026-10-31T23:59:59.000Z',
        escToggle: true,
        autoplayToggle: true,
        dataLayerToggle: true
      },
      slides: [
        {
          id: 1,
          name: 'Slide 1 - Descuento',
          title: 'Aprovecha el 50% de Descuento',
          description: 'Paga tu impuesto vehicular de vigencias anteriores sin intereses de mora.',
          cta: 'Liquidar ahora',
          link: 'https://impuestos.valledelcauca.gov.co/liquidar',
          alt: 'Promoción descuento tributario Valle',
          desktopName: 'cobro-coactivo-desk.png',
          mobileName: 'cobro-coactivo-mob.png',
          desktopPreview: 'http://localhost:3000/resources/tenants/valle/assets/desktop/cobro-coactivo-desk.png',
          mobilePreview: 'http://localhost:3000/resources/tenants/valle/assets/mobile/cobro-coactivo-mob.png'
        },
        {
          id: 2,
          name: 'Slide 2 - Acuerdos',
          title: 'Facilidades de Pago y Financiación',
          description: 'Difiere tu deuda tributaria hasta en 12 cuotas mensuales sin complicaciones.',
          cta: 'Solicitar acuerdo',
          link: 'https://impuestos.valledelcauca.gov.co/acuerdos',
          alt: 'Financiación de obligaciones',
          desktopName: 'acuerdos-pago-desk.png',
          mobileName: 'acuerdos-pago-mob.png',
          desktopPreview: 'http://localhost:3000/resources/tenants/valle/assets/desktop/acuerdos-pago-desk.png',
          mobilePreview: 'http://localhost:3000/resources/tenants/valle/assets/mobile/acuerdos-pago-mob.png'
        },
        {
          id: 3,
          name: 'Slide 3 - Pago Online',
          title: 'Pago Rápido y Seguro por PSE',
          description: 'Paga desde la comodidad de tu hogar con cualquier entidad bancaria.',
          cta: 'Ir a PSE',
          link: 'https://impuestos.valledelcauca.gov.co/pse',
          alt: 'Pasarela de pagos PSE',
          desktopName: 'pago-en-linea-desk.png',
          mobileName: 'pago-en-linea-mob.png',
          desktopPreview: 'http://localhost:3000/resources/tenants/valle/assets/desktop/pago-en-linea-desk.png',
          mobilePreview: 'http://localhost:3000/resources/tenants/valle/assets/mobile/pago-en-linea-mob.png'
        }
      ]
    }
  ];

  fs.writeFileSync(path.join(valleDir, 'campaigns.json'), JSON.stringify(valleCampaigns, null, 2), 'utf-8');

  // Manifest v1 y active.json para Valle
  const valleManifest = {
    id: 'camp-1',
    tenantId: 'valle',
    version: 1,
    versionString: 'v1',
    publishedAt: new Date().toISOString(),
    publishedBy: { name: 'Angie Ríos', role: 'Frontend Lead', id: 'AR' },
    summary: 'Release inicial v1 - Cobro Coactivo 2026',
    layout: 'side',
    rules: valleCampaigns[0].rules,
    slides: valleCampaigns[0].slides.map(s => ({
      id: s.id,
      order: s.id,
      active: true,
      title: s.title,
      description: s.description,
      cta: s.cta,
      link: s.link,
      alt: s.alt,
      desktopImage: s.desktopPreview,
      mobileImage: s.mobilePreview
    }))
  };

  fs.writeFileSync(path.join(valleManifestDir, 'v1.json'), JSON.stringify(valleManifest, null, 2), 'utf-8');
  fs.writeFileSync(path.join(valleManifestDir, 'active.json'), JSON.stringify(valleManifest, null, 2), 'utf-8');

  // Auditoría inicial Valle
  const valleAudit = [
    {
      id: 'aud-seed-1',
      timestamp: new Date().toISOString(),
      formattedTime: new Date().toLocaleString('es-CO'),
      action: 'PUBLICACIÓN',
      campaignId: 'camp-1',
      campaignName: 'Cobro Coactivo 2026',
      version: 'v1',
      user: 'Angie Ríos',
      role: 'Frontend Lead'
    }
  ];
  fs.writeFileSync(path.join(valleDir, 'audit.json'), JSON.stringify(valleAudit, null, 2), 'utf-8');

  // 2. Tenant: MEDELLÍN (Aislamiento multitenant AC-02)
  const medDir = path.join(STORAGE_ROOT, 'tenants', 'medellin');
  const medAssetsDesk = path.join(STORAGE_ROOT, 'resources', 'tenants', 'medellin', 'assets', 'desktop');
  const medAssetsMob = path.join(STORAGE_ROOT, 'resources', 'tenants', 'medellin', 'assets', 'mobile');
  const medManifestDir = path.join(STORAGE_ROOT, 'resources', 'tenants', 'medellin', 'manifests', 'camp-med-1');

  ensureDir(medDir);
  ensureDir(medAssetsDesk);
  ensureDir(medAssetsMob);
  ensureDir(medManifestDir);

  fs.writeFileSync(path.join(medAssetsDesk, 'pico-placa-desk.png'), createSvgPlaceholder('Rotación Pico y Placa 2026', '#2E13F5', '#FFFFFF', 800, 560));
  fs.writeFileSync(path.join(medAssetsMob, 'pico-placa-mob.png'), createSvgPlaceholder('Pico y Placa', '#2E13F5', '#FFFFFF', 420, 420));
  fs.writeFileSync(path.join(medAssetsDesk, 'fotodeteccion-desk.png'), createSvgPlaceholder('Consulte sus comparendos', '#211C33', '#5DC99A', 800, 560));
  fs.writeFileSync(path.join(medAssetsMob, 'fotodeteccion-mob.png'), createSvgPlaceholder('Comparendos Medellín', '#211C33', '#5DC99A', 420, 420));
  fs.writeFileSync(path.join(medAssetsDesk, 'curso-vial-desk.png'), createSvgPlaceholder('Descuento por Curso Vial', '#61C7D0', '#211C33', 800, 560));
  fs.writeFileSync(path.join(medAssetsMob, 'curso-vial-mob.png'), createSvgPlaceholder('Curso Vial 50%', '#61C7D0', '#211C33', 420, 420));

  const medCampaigns = [
    {
      id: 'camp-med-1',
      name: 'Novedades Movilidad Medellín 2026',
      type: 'Modal con slider',
      tenant: 'medellin',
      status: 'Publicado',
      version: 'v1',
      updated: '17 sep 2026',
      layout: 'side',
      rules: {
        delay: 2,
        frequency: 'once_per_device',
        pathRule: '*',
        startDate: '2026-09-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.000Z',
        escToggle: true,
        autoplayToggle: false,
        dataLayerToggle: true
      },
      slides: [
        {
          id: 1,
          name: 'Slide 1 - Pico y Placa',
          title: 'Nueva Rotación de Pico y Placa',
          description: 'Conoce los dígitos de restricción para el primer semestre de 2026 en el Valle de Aburrá.',
          cta: 'Ver rotación',
          link: 'https://www.medellin.gov.co/movilidad/pico-placa',
          alt: 'Restricción vehicular Medellín',
          desktopName: 'pico-placa-desk.png',
          mobileName: 'pico-placa-mob.png',
          desktopPreview: 'http://localhost:3000/resources/tenants/medellin/assets/desktop/pico-placa-desk.png',
          mobilePreview: 'http://localhost:3000/resources/tenants/medellin/assets/mobile/pico-placa-mob.png'
        },
        {
          id: 2,
          name: 'Slide 2 - Comparendos',
          title: 'Consulte sus Infracciones en Línea',
          description: 'Verifique el estado de su vehículo y acceda a descuentos por pronto pago.',
          cta: 'Consultar placa',
          link: 'https://www.medellin.gov.co/movilidad/fotodeteccion',
          alt: 'Consulta de comparendos',
          desktopName: 'fotodeteccion-desk.png',
          mobileName: 'fotodeteccion-mob.png',
          desktopPreview: 'http://localhost:3000/resources/tenants/medellin/assets/desktop/fotodeteccion-desk.png',
          mobilePreview: 'http://localhost:3000/resources/tenants/medellin/assets/mobile/fotodeteccion-mob.png'
        },
        {
          id: 3,
          name: 'Slide 3 - Cursos Viales',
          title: 'Agende su Curso Pedagógico Virtual',
          description: 'Obtenga hasta el 50% de descuento en multas de tránsito realizando el curso vial.',
          cta: 'Agendar cita',
          link: 'https://www.medellin.gov.co/movilidad/cursos',
          alt: 'Cursos pedagógicos',
          desktopName: 'curso-vial-desk.png',
          mobileName: 'curso-vial-mob.png',
          desktopPreview: 'http://localhost:3000/resources/tenants/medellin/assets/desktop/curso-vial-desk.png',
          mobilePreview: 'http://localhost:3000/resources/tenants/medellin/assets/mobile/curso-vial-mob.png'
        }
      ]
    }
  ];

  fs.writeFileSync(path.join(medDir, 'campaigns.json'), JSON.stringify(medCampaigns, null, 2), 'utf-8');

  const medManifest = {
    id: 'camp-med-1',
    tenantId: 'medellin',
    version: 1,
    versionString: 'v1',
    publishedAt: new Date().toISOString(),
    publishedBy: { name: 'Ana María Gómez', role: 'UI Lead', id: 'AG' },
    summary: 'Release inicial v1 - Novedades Medellín 2026',
    layout: 'side',
    rules: medCampaigns[0].rules,
    slides: medCampaigns[0].slides.map(s => ({
      id: s.id,
      order: s.id,
      active: true,
      title: s.title,
      description: s.description,
      cta: s.cta,
      link: s.link,
      alt: s.alt,
      desktopImage: s.desktopPreview,
      mobileImage: s.mobilePreview
    }))
  };

  fs.writeFileSync(path.join(medManifestDir, 'v1.json'), JSON.stringify(medManifest, null, 2), 'utf-8');
  fs.writeFileSync(path.join(medManifestDir, 'active.json'), JSON.stringify(medManifest, null, 2), 'utf-8');

  // Auditoría inicial Medellín
  const medAudit = [
    {
      id: 'aud-seed-med-1',
      timestamp: new Date().toISOString(),
      formattedTime: new Date().toLocaleString('es-CO'),
      action: 'PUBLICACIÓN',
      campaignId: 'camp-med-1',
      campaignName: 'Novedades Movilidad Medellín 2026',
      version: 'v1',
      user: 'Ana María Gómez',
      role: 'UI Lead'
    }
  ];
  fs.writeFileSync(path.join(medDir, 'audit.json'), JSON.stringify(medAudit, null, 2), 'utf-8');

  console.log('✅ Datos semilla creados correctamente para Valle y Medellín.');
}

module.exports = { seed };

if (require.main === module) {
  seed();
}

