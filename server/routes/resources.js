const path = require('path');
const express = require('express');
const multer = require('multer');

function parseImageDimensions(buffer) {
  try {
    if (buffer.length > 24 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    if (buffer.length > 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      const type = buffer.toString('ascii', 12, 16);
      if (type === 'VP8X') return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
      if (type === 'VP8 ') return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
      if (type === 'VP8L') return { width: 1 + (((buffer[22] & 0x3f) << 8) | buffer[21]), height: 1 + (((buffer[24] & 0x0f) << 10) | (buffer[23] << 2) | ((buffer[22] & 0xc0) >> 6)) };
    }
    if (buffer.length > 10 && buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xFF) break;
        const marker = buffer[offset + 1];
        if (marker === 0xC0 || marker === 0xC2) return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
        offset += 2 + buffer.readUInt16BE(offset + 2);
      }
    }
  } catch (error) {
    console.warn('No se pudieron extraer dimensiones de la imagen:', error.message);
  }
  return null;
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = function createResourceRouter({ storageProvider }) {
  const router = express.Router();

  router.post('/upload', upload.single('file'), async (req, res, next) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ valid: false, error: 'No se envió ningún archivo para cargar.' });
      const targetType = req.body.targetType === 'mobile' ? 'mobile' : 'desktop';
      const dimensions = parseImageDimensions(file.buffer);
      const recommended = targetType === 'desktop' ? { w: 800, h: 560 } : { w: 420, h: 420 };
      const minDimensions = targetType === 'desktop' ? { w: 200, h: 150 } : { w: 150, h: 150 };
      const maxDimensions = targetType === 'desktop' ? { w: 1920, h: 1200 } : { w: 1200, h: 1920 };
      const errors = [];

      // Validar formato MIME real (AC-06)
      const allowedMimes = ['image/webp', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedMimes.includes(file.mimetype)) {
        errors.push(`Formato "${file.mimetype}" no permitido. Solo se autoriza WebP, PNG y JPG.`);
      }

      // Validar peso físico (AC-06, AC-20) - Límite realista de 2 MB para popups web
      const maxBytes = 2 * 1024 * 1024;
      if (file.size > maxBytes) {
        errors.push(`El archivo pesa ${(file.size / (1024 * 1024)).toFixed(2)} MB, superando el límite máximo permitido de 2 MB.`);
      }

      // Validar dimensiones mínimas y máximas coherentes con un modal (AC-06, AC-20)
      if (dimensions) {
        if (dimensions.width > maxDimensions.w || dimensions.height > maxDimensions.h) {
          errors.push(`Dimensiones excesivas (${dimensions.width}×${dimensions.height}px). El límite máximo para ${targetType} es ${maxDimensions.w}×${maxDimensions.h}px (recomendado: ${recommended.w}×${recommended.h}px).`);
        }
        if (dimensions.width < minDimensions.w || dimensions.height < minDimensions.h) {
          errors.push(`Dimensiones insuficientes (${dimensions.width}×${dimensions.height}px). El tamaño mínimo requerido para ${targetType} es ${minDimensions.w}×${minDimensions.h}px.`);
        }
      }

      // Sanitizar estrictamente el nombre del archivo evitando path traversal (AC-06, AC-19)
      const rawBaseName = path.basename(file.originalname || 'imagen');
      const sanitizedOriginal = rawBaseName.replace(/[^a-zA-Z0-9._-]/g, '_');
      if (!/^[a-zA-Z0-9._-]+\.(webp|png|jpg|jpeg)$/i.test(sanitizedOriginal)) {
        errors.push('Nombre de archivo inválido o extensión de imagen no reconocida.');
      }

      if (errors.length) {
        return res.status(400).json({ valid: false, errors, sizeBytes: file.size, dimensions: dimensions ? `${dimensions.width}×${dimensions.height}` : 'Desconocidas' });
      }

      const asset = await storageProvider.saveAsset({ tenantId: req.body.tenant || 'valle', targetType, filename: `${Date.now()}_${sanitizedOriginal}`, content: file.buffer });
      res.json({ valid: true, name: sanitizedOriginal, filename: asset.filename, url: asset.url, cdnPath: asset.cdnPath, sizeBytes: file.size, sizeKb: `${(file.size / 1024).toFixed(1)} KB`, dimensions: dimensions ? `${dimensions.width}×${dimensions.height}` : `${recommended.w}×${recommended.h}`, status: 'Verificado' });
    } catch (error) {
      next(error);
    }
  });

  router.get('/', async (req, res, next) => {
    try {
      const assets = await storageProvider.listAssets(req.query.tenant || 'valle');
      const folders = ['desktop', 'mobile'].map(target => {
        const scoped = assets.filter(asset => asset.target === target);
        return { id: target, name: `assets/${target}/`, path: `resources/tenants/${scoped[0]?.tenant || req.query.tenant || 'valle'}/assets/${target}/`, fileCount: scoped.length, totalSize: `${(scoped.reduce((total, asset) => total + asset.sizeBytes, 0) / 1024).toFixed(1)} KB` };
      });
      res.json({
        folders,
        assets: assets.map(asset => ({ id: `${asset.target}-${asset.filename}`, name: asset.filename, type: asset.filename.split('.').pop()?.toUpperCase() || 'IMG', dimensions: (() => { const dimensions = parseImageDimensions(asset.buffer); return dimensions ? `${dimensions.width}×${dimensions.height}` : (asset.target === 'desktop' ? '800×560' : '420×420'); })(), size: `${(asset.sizeBytes / 1024).toFixed(1)} KB`, status: 'Verificado', cdnPath: asset.cdnPath, url: asset.url }))
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
