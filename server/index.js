const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { seed } = require('./seed');

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar CORS para peticiones desde Angular (localhost:4200) y portal de pruebas
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Inicializar datos semilla si no existen
const STORAGE_ROOT = path.join(__dirname, 'storage');
if (!fs.existsSync(path.join(STORAGE_ROOT, 'tenants', 'valle', 'campaigns.json'))) {
  seed();
}

// Rutas de API REST (Plano de Control)
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api', require('./routes/resources')); // para POST /api/upload
app.use('/api/publish', require('./routes/publish'));
app.use('/api/gtm', require('./routes/gtm'));

// Servidor de Recursos CDN Multitenant (Plano de Datos)
// Acceso a imágenes: /resources/tenants/{tenant}/assets/{desktop|mobile}/...
// Acceso a manifiestos: /resources/tenants/{tenant}/manifests/{campaignId}/active.json
app.use('/resources', express.static(path.join(STORAGE_ROOT, 'resources'), {
  setHeaders: (res, filePath) => {
    // Evitar caché agresivo en active.json y en el runtime para que los cambios se vean al instante (AC-12, AC-16)
    if (filePath.endsWith('active.json') || filePath.endsWith('quipux-popup-runtime.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }

    // Si un archivo contiene marcado SVG pero tiene extensión .png/.webp (seed), servir como image/svg+xml
    if (filePath.endsWith('.png') || filePath.endsWith('.webp') || filePath.endsWith('.jpg') || filePath.endsWith('.svg')) {
      try {
        const buffer = Buffer.alloc(150);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, buffer, 0, 150, 0);
        fs.closeSync(fd);
        if (buffer.toString('utf-8').includes('<svg')) {
          res.setHeader('Content-Type', 'image/svg+xml');
        }
      } catch (e) {}
    }
  }
}));

// Servidor del Portal Simulador Externo
const PORTAL_DEMO_DIR = path.join(__dirname, '..', 'portal-demo');
if (!fs.existsSync(PORTAL_DEMO_DIR)) {
  fs.mkdirSync(PORTAL_DEMO_DIR, { recursive: true });
}
app.use('/portal-demo', express.static(PORTAL_DEMO_DIR));
app.get('/portal-demo*', (req, res) => {
  res.sendFile(path.join(PORTAL_DEMO_DIR, 'index.html'));
});

// Soporte de rutas SPA directas del simulador
app.get(['/tramites*', '/liquidaciones*', '/pagos*', '/contacto*'], (req, res) => {
  res.sendFile(path.join(PORTAL_DEMO_DIR, 'index.html'));
});

// Redirigir la raíz / directamente al Portal Ciudadano Simulador
app.get('/', (req, res) => {
  res.redirect('/portal-demo/');
});

// Endpoint de salud del servidor
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    server: 'Quipux Popup Studio CDN & REST Server',
    time: new Date().toISOString(),
    port: PORT
  });
});

// Fallback universal: cualquier ruta GET que no sea /api o /resources sirve el portal ciudadano
app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/resources')) {
    return res.status(404).json({ error: 'Endpoint no encontrado' });
  }
  res.sendFile(path.join(PORTAL_DEMO_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Quipux CDN & API ejecutándose en http://localhost:${PORT}`);
  console.log(`📁 Almacenamiento multitenant en: ${STORAGE_ROOT}`);
  console.log(`🌐 Portal simulador en: http://localhost:${PORT}/portal-demo`);
});
