const express = require('express');

module.exports = function createPublishRouter({ publishingService, manifestRepository }) {
  const router = express.Router();

  router.get('/versions', async (req, res, next) => {
    try {
      res.json(await publishingService.listVersions(req.query.tenant || 'valle', req.query.campaignId || 'default'));
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const { campaign, author } = req.body;
      if (!campaign?.id) return res.status(400).json({ error: 'Campaña inválida para publicar.' });
      const result = await publishingService.publish({ campaign, author, tenant: campaign.tenant || req.query.tenant || 'valle' });
      if (!result.success) return res.status(400).json({ success: false, error: 'Falló la verificación preflight antes de publicar.', preflights: result.preflights });
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post('/rollback', async (req, res, next) => {
    try {
      const result = await publishingService.rollback({
        tenant: req.body.tenantId || req.query.tenant || 'valle',
        campaignId: req.body.campaignId,
        targetVersion: req.body.targetVersion,
        author: req.body.author
      });
      if (!result) return res.status(404).json({ error: 'La versión solicitada no existe en el historial del tenant.' });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  });

  router.post('/toggle-status', async (req, res, next) => {
    try {
      const { campaignId, targetStatus, author } = req.body;
      const tenant = req.body.tenantId || req.body.tenant || req.query.tenant || 'valle';
      if (!campaignId || !targetStatus) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos (campaignId, targetStatus).' });
      }
      const result = await publishingService.toggleCampaignStatus({
        tenant,
        campaignId,
        targetStatus,
        author
      });
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get('/audit', async (req, res, next) => {
    try {
      res.json(await manifestRepository.listAudit(req.query.tenant || 'valle'));
    } catch (error) {
      next(error);
    }
  });

  return router;
};
