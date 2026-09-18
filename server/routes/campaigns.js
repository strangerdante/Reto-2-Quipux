const express = require('express');

module.exports = function createCampaignRouter({ campaignRepository }) {
  const router = express.Router();

  router.get('/', async (req, res, next) => {
    try {
      res.json(await campaignRepository.list(req.query.tenant || 'valle'));
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const tenant = req.query.tenant || 'valle';
      const campaign = await campaignRepository.find(tenant, req.params.id);
      if (!campaign) return res.status(404).json({ error: `Campaña no encontrada para el tenant ${tenant}` });
      res.json(campaign);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const tenant = req.body.tenant || req.query.tenant || 'valle';
      const campaign = {
        ...req.body,
        id: req.body.id || `camp-${Date.now()}`,
        tenant,
        updated: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
      };
      res.json({ success: true, campaign: await campaignRepository.save(tenant, campaign) });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const removed = await campaignRepository.delete(req.query.tenant || 'valle', req.params.id);
      if (!removed) return res.status(404).json({ error: 'Campaña no encontrada.' });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
