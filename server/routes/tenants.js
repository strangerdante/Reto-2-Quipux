const express = require('express');

module.exports = function createTenantRouter({ tenantRepository }) {
  const router = express.Router();

  router.get('/', async (req, res, next) => {
    try {
      const tenants = await tenantRepository.list();
      res.json(tenants);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const tenant = await tenantRepository.find(req.params.id);
      if (!tenant) {
        return res.status(404).json({ error: `Portal "${req.params.id}" no encontrado` });
      }
      res.json(tenant);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const { id, name, portalUrl, logoUrl } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'El nombre del portal es obligatorio' });
      }

      const created = await tenantRepository.create({
        id: id || name,
        name,
        portalUrl,
        logoUrl
      });

      res.status(201).json({
        success: true,
        tenant: created,
        message: `Portal "${created.name}" registrado exitosamente`
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
};
