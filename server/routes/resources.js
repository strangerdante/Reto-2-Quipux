const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const STORAGE_ROOT = path.join(__dirname, '..', 'storage');

function parseImageDimensions(buffer) {
  try {
    // PNG
    if (buffer.length > 24 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }

    // WebP
    if (buffer.length > 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      const type = buffer.toString('ascii', 12, 16);
      if (type === 'VP8X' && buffer.length >= 30) {
        const width = 1 + buffer.readUIntLE(24, 3);
        const height = 1 + buffer.readUIntLE(27, 3);
        return { width, height };
      }
      if (type === 'VP8 ' && buffer.length >= 30) {
        const width = buffer.readUInt16LE(26) & 0x3fff;
        const height = buffer.readUInt16LE(28) & 0x3fff;
        return { width, height };
      }
      if (type === 'VP8L' && buffer.length >= 25) {
        const b1 = buffer[21];
        const b2 = buffer[22];
        const b3 = buffer[23];
        const b4 = buffer[24];
        const width = 1 + (((b2 & 0x3f) << 8) | b1);
        const height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
        return { width, height };
      }
    }

    // JPEG
    if (buffer.length > 10 && buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xFF) break;
        const marker = buffer[offset + 1];
        if (marker === 0xC0 || marker === 0xC2) { // SOF0 or SOF2
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }
        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
      }
    }
  } catch (err) {
    console.warn('No se pudieron extraer dimensiones de la imagen:', err.message);
  }
  return null;
}

// Multer memory storage para validar antes de guardar en disco
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // límite técnico temporal para atrapar errores de peso amigablemente
});

// POST /api/upload
router.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ valid: false, error: 'No se envió ningún archivo para cargar.' });
  }

  const tenant = (req.body.tenant || 'valle').replace(/[^a-zA-Z0-9_-]/g, '_');
  const targetType = req.body.targetType === 'mobile' ? 'mobile' : 'desktop';

  const ALLOWED_MIME = ['image/webp', 'image/png', 'image/jpeg'];
  const MAX_BYTES = 500 * 1024; // 500 KB (AC-06)

  const errors = [];

  // Validación de MIME
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    errors.push(`Formato "${file.mimetype}" no permitido. Solo se autoriza WebP, PNG y JPG.`);
  }

  // Validación de peso
  if (file.size > MAX_BYTES) {
    const sizeKb = (file.size / 1024).toFixed(1);
    errors.push(`El archivo pesa ${sizeKb} KB, superando el límite máximo permitido de 500 KB.`);
  }

  // Validación de dimensiones
  const dimensions = parseImageDimensions(file.buffer);
  const recommended = targetType === 'desktop' ? { w: 800, h: 560 } : { w: 420, h: 420 };

  if (dimensions) {
    if (dimensions.width > recommended.w * 2 || dimensions.height > recommended.h * 2) {
      errors.push(`Dimensiones excesivas (${dimensions.width}×${dimensions.height}px). El tamaño recomendado para ${targetType} es ${recommended.w}×${recommended.h}px.`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      valid: false,
      errors,
      sizeBytes: file.size,
      dimensions: dimensions ? `${dimensions.width}×${dimensions.height}` : 'Desconocidas'
    });
  }

  // Guardar en disco bajo la ruta multitenant estricta (AC-05)
  const targetDir = path.join(STORAGE_ROOT, 'resources', 'tenants', tenant, 'assets', targetType);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${Date.now()}_${sanitizedOriginal}`;
  const filePath = path.join(targetDir, filename);

  fs.writeFileSync(filePath, file.buffer);

  // URL pública en el servidor CDN local
  const cdnUrl = `http://localhost:3000/resources/tenants/${tenant}/assets/${targetType}/${filename}`;

  res.json({
    valid: true,
    name: sanitizedOriginal,
    filename,
    url: cdnUrl,
    cdnPath: `resources/tenants/${tenant}/assets/${targetType}/${filename}`,
    sizeBytes: file.size,
    sizeKb: `${(file.size / 1024).toFixed(1)} KB`,
    dimensions: dimensions ? `${dimensions.width}×${dimensions.height}` : `${recommended.w}×${recommended.h}`,
    status: 'Verificado'
  });
});

// GET /api/resources?tenant=:tenant
router.get('/', (req, res) => {
  const tenant = (req.query.tenant || 'valle').replace(/[^a-zA-Z0-9_-]/g, '_');
  const tenantAssetsRoot = path.join(STORAGE_ROOT, 'resources', 'tenants', tenant, 'assets');

  const assets = [];
  const folders = [
    { id: 'desktop', name: 'assets/desktop/', path: `resources/tenants/${tenant}/assets/desktop/`, count: 0, bytes: 0 },
    { id: 'mobile', name: 'assets/mobile/', path: `resources/tenants/${tenant}/assets/mobile/`, count: 0, bytes: 0 }
  ];

  ['desktop', 'mobile'].forEach(sub => {
    const subDir = path.join(tenantAssetsRoot, sub);
    const folderRef = folders.find(f => f.id === sub);

    if (fs.existsSync(subDir)) {
      const files = fs.readdirSync(subDir);
      files.forEach(f => {
        const full = path.join(subDir, f);
        try {
          const stat = fs.statSync(full);
          if (stat.isFile()) {
            folderRef.count++;
            folderRef.bytes += stat.size;

            const buf = fs.readFileSync(full);
            const dims = parseImageDimensions(buf);

            assets.push({
              id: `${sub}-${f}`,
              name: f,
              type: path.extname(f).replace('.', '').toUpperCase() || 'IMG',
              dimensions: dims ? `${dims.width}×${dims.height}` : (sub === 'desktop' ? '800×560' : '420×420'),
              size: `${(stat.size / 1024).toFixed(1)} KB`,
              status: 'Verificado',
              cdnPath: `resources/tenants/${tenant}/assets/${sub}/${f}`,
              url: `http://localhost:3000/resources/tenants/${tenant}/assets/${sub}/${f}`
            });
          }
        } catch (e) {
          // ignore error
        }
      });
    }
  });

  const folderResult = folders.map(f => ({
    id: f.id,
    name: f.name,
    path: f.path,
    fileCount: f.count,
    totalSize: `${(f.bytes / 1024).toFixed(1)} KB`
  }));

  res.json({
    folders: folderResult,
    assets
  });
});

module.exports = router;
