const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { seed } = require('./seed');
const {
  config,
  fileStore,
  campaignRepository,
  manifestRepository,
  tenantRepository,
  storageProvider,
  publishingService
} = require('./container');

async function start() {
  const seedCampaignFile = fileStore.path('tenants', 'valle', 'campaigns.json');
  if (!(await fileStore.exists(seedCampaignFile))) seed();

  const app = express();
  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use('/api/tenants', require('./routes/tenants')({ tenantRepository }));
  app.use('/api/campaigns', require('./routes/campaigns')({ campaignRepository }));
  const resourceRouter = require('./routes/resources')({ storageProvider });
  app.use('/api/resources', resourceRouter);
  app.use('/api', resourceRouter);
  app.use('/api/publish', require('./routes/publish')({ publishingService, manifestRepository }));
  app.use('/api/gtm', require('./routes/gtm')({ config }));

  app.use('/resources', express.static(path.join(config.storageRoot, 'resources'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('active.json') || filePath.endsWith('quipux-popup-runtime.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }

      // Los placeholders de desarrollo usan SVG con extensión de imagen para simplificar el seed local.
      if (filePath.endsWith('.png') || filePath.endsWith('.webp') || filePath.endsWith('.jpg') || filePath.endsWith('.svg')) {
        try {
          const buffer = Buffer.alloc(150);
          const descriptor = fs.openSync(filePath, 'r');
          fs.readSync(descriptor, buffer, 0, 150, 0);
          fs.closeSync(descriptor);
          if (buffer.toString('utf-8').includes('<svg')) res.setHeader('Content-Type', 'image/svg+xml');
        } catch {
          // express.static responderá el archivo o el 404 correspondiente.
        }
      }
    }
  }));

  const portalDemoDirectory = path.join(__dirname, '..', 'portal-demo');
  app.use('/portal-demo', express.static(portalDemoDirectory));
  app.get('/portal-demo*', (req, res) => res.sendFile(path.join(portalDemoDirectory, 'index.html')));

  const portalNuevoDirectory = path.join(__dirname, '..', 'portal-nuevo');
  app.use('/portal-nuevo', express.static(portalNuevoDirectory));
  app.get('/portal-nuevo*', (req, res) => res.sendFile(path.join(portalNuevoDirectory, 'index.html')));

  app.get(['/tramites*', '/liquidaciones*'], (req, res) => res.sendFile(path.join(portalDemoDirectory, 'index.html')));
  app.get('/', (req, res) => res.redirect('/portal-demo/'));
  app.get('/api/health', (req, res) => res.json({
    status: 'online',
    server: 'Quipux Popup Studio CDN & REST Server',
    time: new Date().toISOString(),
    port: config.port,
    apiBaseUrl: config.apiBaseUrl,
    cdnBaseUrl: config.cdnBaseUrl
  }));

  app.get('*', (req, res) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/resources')) return res.status(404).json({ error: 'Endpoint no encontrado' });
    return res.sendFile(path.join(portalDemoDirectory, 'index.html'));
  });

  app.use((error, req, res, next) => {
    console.error('[API]', error);
    res.status(error.status || 500).json({ error: error.message || 'No fue posible completar la operación solicitada.' });
  });

  app.listen(config.port, () => {
    const bold = '\x1b[1m';
    const reset = '\x1b[0m';
    const underline = '\x1b[4m';
    const cyan = '\x1b[96m';
    const green = '\x1b[92m';
    const white = '\x1b[97m';
    const bgBlue = '\x1b[44m';
    const bgGreen = '\x1b[42m';

    console.log(
      `\n` +
      `  ${bold}${cyan}─────────────────────────────────────────────────────────────────${reset}\n` +
      `  ${bgBlue}${white}${bold}  🚀 QUIPUX COMPONENT STUDIO  ${reset}\n` +
      `  ${bold}➜  URL:${reset} ${bold}${cyan}${underline}http://localhost:4200/${reset}\n` +
      `\n` +
      `  ${bgGreen}${white}${bold}  🌐 PORTAL SIMULADOR (DEMO)  ${reset}\n` +
      `  ${bold}➜  URL:${reset} ${bold}${green}${underline}${config.publicBaseUrl}/portal-demo/${reset}\n` +
      `  ${bold}${cyan}─────────────────────────────────────────────────────────────────${reset}\n`
    );
  });
}

start().catch(error => {
  console.error('No fue posible iniciar el servidor:', error);
  process.exitCode = 1;
});
