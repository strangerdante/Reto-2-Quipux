const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const STORAGE_ROOT = path.join(__dirname, '..', 'storage');

function getTenantDir(tenantId) {
  const safeTenant = (tenantId || 'valle').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dir = path.join(STORAGE_ROOT, 'tenants', safeTenant);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getCampaignsFile(tenantId) {
  return path.join(getTenantDir(tenantId), 'campaigns.json');
}

function readCampaigns(tenantId) {
  const filePath = getCampaignsFile(tenantId);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error leyendo campañas para tenant', tenantId, err);
    return [];
  }
}

function writeCampaigns(tenantId, campaigns) {
  const filePath = getCampaignsFile(tenantId);
  fs.writeFileSync(filePath, JSON.stringify(campaigns, null, 2), 'utf-8');
}

// GET /api/campaigns?tenant=:tenant
router.get('/', (req, res) => {
  const tenant = req.query.tenant || 'valle';
  const campaigns = readCampaigns(tenant);
  res.json(campaigns);
});

// GET /api/campaigns/:id?tenant=:tenant
router.get('/:id', (req, res) => {
  const tenant = req.query.tenant || 'valle';
  const campaigns = readCampaigns(tenant);
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaña no encontrada para el tenant ' + tenant });
  }
  res.json(campaign);
});

// POST /api/campaigns
router.post('/', (req, res) => {
  const campaignData = req.body;
  const tenant = campaignData.tenant || req.query.tenant || 'valle';

  if (!campaignData.id) {
    campaignData.id = 'camp-' + Date.now();
  }
  campaignData.updated = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

  const campaigns = readCampaigns(tenant);
  const index = campaigns.findIndex(c => c.id === campaignData.id);

  if (index >= 0) {
    campaigns[index] = { ...campaigns[index], ...campaignData };
  } else {
    campaigns.unshift(campaignData);
  }

  writeCampaigns(tenant, campaigns);
  res.json({ success: true, campaign: campaignData });
});

// DELETE /api/campaigns/:id?tenant=:tenant
router.delete('/:id', (req, res) => {
  const tenant = req.query.tenant || 'valle';
  let campaigns = readCampaigns(tenant);
  campaigns = campaigns.filter(c => c.id !== req.params.id);
  writeCampaigns(tenant, campaigns);
  res.json({ success: true });
});

module.exports = router;
