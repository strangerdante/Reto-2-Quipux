const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const STORAGE_ROOT = path.join(__dirname, '..', 'storage');

function getManifestsDir(tenantId, campaignId) {
  const safeTenant = (tenantId || 'valle').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeCampaign = (campaignId || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dir = path.join(STORAGE_ROOT, 'resources', 'tenants', safeTenant, 'manifests', safeCampaign);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getAuditFile(tenantId) {
  const safeTenant = (tenantId || 'valle').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dir = path.join(STORAGE_ROOT, 'tenants', safeTenant);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, 'audit.json');
}

function readAudit(tenantId) {
  const filePath = getAuditFile(tenantId);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function appendAudit(tenantId, entry) {
  const audit = readAudit(tenantId);
  audit.unshift({
    id: 'aud-' + Date.now(),
    timestamp: new Date().toISOString(),
    formattedTime: new Date().toLocaleString('es-CO'),
    ...entry
  });
  fs.writeFileSync(getAuditFile(tenantId), JSON.stringify(audit, null, 2), 'utf-8');
}

// GET /api/publish/versions?tenant=:tenant&campaignId=:campaignId
router.get('/versions', (req, res) => {
  const tenant = req.query.tenant || 'valle';
  const campaignId = req.query.campaignId || 'default';
  const dir = getManifestsDir(tenant, campaignId);

  const versions = [];
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    // Buscar v*.json
    const vFiles = files.filter(f => /^v\d+\.json$/.test(f));
    
    // Leer active.json si existe para saber la versión activa actual
    let activeVersion = null;
    const activePath = path.join(dir, 'active.json');
    if (fs.existsSync(activePath)) {
      try {
        const activeManifest = JSON.parse(fs.readFileSync(activePath, 'utf-8'));
        activeVersion = activeManifest.version;
      } catch (e) {}
    }

    vFiles.forEach(f => {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
        const vNum = content.version || parseInt(f.replace('v', '').replace('.json', ''), 10);
        versions.push({
          id: `ver-${vNum}`,
          version: `v${vNum}`,
          author: content.publishedBy ? `${content.publishedBy.name} · ${content.publishedBy.role}` : 'Administrador',
          timestamp: content.publishedAt ? new Date(content.publishedAt).toLocaleString('es-CO') : 'Reciente',
          summary: content.summary || `Publicación v${vNum} con ${content.slides?.length || 0} slide(s)`,
          isCurrent: activeVersion ? (vNum === activeVersion || `v${vNum}` === activeVersion) : false,
          snapshot: content
        });
      } catch (e) {}
    });
  }

  // Ordenar de versión mayor a menor
  versions.sort((a, b) => {
    const numA = parseInt(a.version.replace('v', ''), 10);
    const numB = parseInt(b.version.replace('v', ''), 10);
    return numB - numA;
  });

  res.json(versions);
});

// POST /api/publish
router.post('/', (req, res) => {
  const { campaign, author } = req.body;
  if (!campaign || !campaign.id) {
    return res.status(400).json({ error: 'Campaña inválida para publicar.' });
  }

  const tenant = campaign.tenant || req.query.tenant || 'valle';
  const dir = getManifestsDir(tenant, campaign.id);

  // 1. Preflight Checks reales
  const preflights = [];

  // Chequeo de slides
  const hasSlides = Array.isArray(campaign.slides) && campaign.slides.length > 0;
  preflights.push({
    id: 'slides-count',
    label: 'Slides de contenido',
    detail: hasSlides ? `${campaign.slides.length} slide(s) configurado(s)` : 'Debe tener al menos 1 slide',
    passed: hasSlides
  });

  // Chequeo de enlaces HTTPS / seguros (AC-19)
  let insecureLinks = 0;
  if (hasSlides) {
    campaign.slides.forEach(s => {
      if (s.link && s.link.trim() !== '') {
        const link = s.link.trim();
        if (!link.startsWith('https://') && !link.startsWith('/') && !link.startsWith('#')) {
          insecureLinks++;
        }
      }
    });
  }
  preflights.push({
    id: 'https-security',
    label: 'Protocolo de enlaces CTA seguro (HTTPS)',
    detail: insecureLinks === 0 ? 'Todos los enlaces cumplen HTTPS o ruta relativa' : `${insecureLinks} enlace(s) no usan HTTPS`,
    passed: insecureLinks === 0
  });

  // Chequeo de imágenes responsive (AC-05, AC-07)
  let missingImages = 0;
  if (hasSlides) {
    campaign.slides.forEach(s => {
      if (!s.desktopPreview && !s.desktopName) missingImages++;
    });
  }
  preflights.push({
    id: 'images-loaded',
    label: 'Recursos multimedia asignados',
    detail: missingImages === 0 ? 'Todas las diapositivas cuentan con imagen' : `${missingImages} slide(s) sin imagen desktop`,
    passed: missingImages === 0
  });

  const allPassed = preflights.every(p => p.passed);
  if (!allPassed) {
    return res.status(400).json({
      success: false,
      error: 'Falló la verificación preflight antes de publicar.',
      preflights
    });
  }

  // 2. Determinar siguiente número de versión
  const existingFiles = fs.readdirSync(dir).filter(f => /^v\d+\.json$/.test(f));
  let maxV = 0;
  existingFiles.forEach(f => {
    const num = parseInt(f.replace('v', '').replace('.json', ''), 10);
    if (!isNaN(num) && num > maxV) maxV = num;
  });
  const newVersionNum = maxV + 1;
  const newVersionStr = `v${newVersionNum}`;

  // 3. Crear manifest inmutable
  const manifest = {
    id: campaign.id,
    tenantId: tenant,
    version: newVersionNum,
    versionString: newVersionStr,
    publishedAt: new Date().toISOString(),
    publishedBy: author || { name: 'Angie Ríos', role: 'Frontend Lead', id: 'AR' },
    summary: `Publicación ${newVersionStr} - ${campaign.name}`,
    layout: campaign.layout || 'side',
    rules: {
      delay: campaign.rules?.delay || 0,
      frequency: campaign.rules?.frequency || 'once_per_session',
      pathRule: campaign.rules?.pathRule || '*',
      startDate: campaign.rules?.startDate || null,
      endDate: campaign.rules?.endDate || null,
      escToggle: campaign.rules?.escToggle !== false,
      autoplayToggle: !!campaign.rules?.autoplayToggle,
      dataLayerToggle: campaign.rules?.dataLayerToggle !== false
    },
    slides: (campaign.slides || []).map((s, idx) => ({
      id: s.id || idx + 1,
      order: idx + 1,
      active: s.active !== false,
      title: s.title || '',
      description: s.description || '',
      cta: s.cta || 'Conocer más',
      link: s.link || '#',
      alt: s.alt || s.title || 'Slide de popup',
      desktopImage: s.desktopPreview || s.desktopName || '',
      mobileImage: s.mobilePreview || s.mobileName || s.desktopPreview || ''
    }))
  };

  // Guardar snapshot inmutable v{N}.json (AC-13)
  fs.writeFileSync(path.join(dir, `v${newVersionNum}.json`), JSON.stringify(manifest, null, 2), 'utf-8');

  // Guardar/sobrescribir release activo active.json (AC-12)
  fs.writeFileSync(path.join(dir, 'active.json'), JSON.stringify(manifest, null, 2), 'utf-8');

  // Registrar auditoría (AC-15)
  appendAudit(tenant, {
    action: 'PUBLICACIÓN',
    campaignId: campaign.id,
    campaignName: campaign.name,
    version: newVersionStr,
    user: author ? author.name : 'Angie Ríos',
    role: author ? author.role : 'Frontend Lead'
  });

  res.json({
    success: true,
    version: newVersionStr,
    versionNum: newVersionNum,
    manifest,
    preflights,
    activeUrl: `http://localhost:3000/resources/tenants/${tenant}/manifests/${campaign.id}/active.json`
  });
});

// POST /api/publish/rollback
router.post('/rollback', (req, res) => {
  const { tenantId, campaignId, targetVersion, author } = req.body;
  const tenant = tenantId || req.query.tenant || 'valle';
  const dir = getManifestsDir(tenant, campaignId);

  const cleanV = String(targetVersion).replace(/[^0-9]/g, '');
  const snapshotFile = path.join(dir, `v${cleanV}.json`);

  if (!fs.existsSync(snapshotFile)) {
    return res.status(404).json({ error: `La versión v${cleanV} no existe en el historial del tenant ${tenant}.` });
  }

  const snapshotContent = JSON.parse(fs.readFileSync(snapshotFile, 'utf-8'));

  // Determinar siguiente número de versión para el nuevo release
  const existingFiles = fs.readdirSync(dir).filter(f => /^v\d+\.json$/.test(f));
  let maxV = 0;
  existingFiles.forEach(f => {
    const num = parseInt(f.replace('v', '').replace('.json', ''), 10);
    if (!isNaN(num) && num > maxV) maxV = num;
  });
  const newV = maxV + 1;

  const restoredManifest = {
    ...snapshotContent,
    version: newV,
    versionString: `v${newV}`,
    publishedAt: new Date().toISOString(),
    publishedBy: author || { name: 'Angie Ríos', role: 'Frontend Lead', id: 'AR' },
    summary: `Reversión a contenido de v${cleanV}`
  };

  // Guardar snapshot v{newV} y active.json
  fs.writeFileSync(path.join(dir, `v${newV}.json`), JSON.stringify(restoredManifest, null, 2), 'utf-8');
  fs.writeFileSync(path.join(dir, 'active.json'), JSON.stringify(restoredManifest, null, 2), 'utf-8');

  // Registrar auditoría de rollback (AC-14, AC-15)
  appendAudit(tenant, {
    action: 'REVERSIÓN',
    campaignId: campaignId,
    campaignName: restoredManifest.summary,
    version: `v${newV} (restaurada de v${cleanV})`,
    user: author ? author.name : 'Angie Ríos',
    role: author ? author.role : 'Frontend Lead'
  });

  res.json({
    success: true,
    newVersion: `v${newV}`,
    restoredFrom: `v${cleanV}`,
    manifest: restoredManifest
  });
});

// GET /api/publish/audit?tenant=:tenant
router.get('/audit', (req, res) => {
  const tenant = req.query.tenant || 'valle';
  const auditEntries = readAudit(tenant);
  res.json(auditEntries);
});

module.exports = router;
