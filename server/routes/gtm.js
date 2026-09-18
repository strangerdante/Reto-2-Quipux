const express = require('express');
const { safeSegment } = require('../infrastructure/file-store');

module.exports = function createGtmRouter({ config }) {
  const router = express.Router();

  router.get(['/workspace-export', '/export'], (req, res) => {
    const tenant = safeSegment(req.query.tenant, 'valle');
    const loader = `<!-- Quipux Popup Studio Idempotent Loader -->\n<script async src="${config.runtimeUrl()}" data-tenant="${tenant}" data-campaign="active" data-cdn-url="${config.cdnBaseUrl}"></script>`;
    const gtmExport = {
      exportFormatVersion: 2,
      exportTime: new Date().toISOString(),
      containerVersion: {
        path: 'accounts/1000/containers/2000/versions/0',
        accountId: '1000', containerId: '2000', containerVersionId: '0',
        name: `Quipux Popup Studio - Workspace ${tenant.toUpperCase()}`,
        description: `Contenedor autogenerado para inyección idempotente del Web Component Quipux Popup Studio (${tenant}).`,
        tag: [{ accountId: '1000', containerId: '2000', tagId: '1', name: `Quipux Popup Studio - Autonomous Loader (${tenant})`, type: 'html', parameter: [{ type: 'template', key: 'html', value: loader }, { type: 'boolean', key: 'supportDocumentWrite', value: 'false' }], firingTriggerId: ['2147479553'] }],
        trigger: [{ accountId: '1000', containerId: '2000', triggerId: '2147479553', name: 'DOM Ready - Todas las páginas', type: 'domReady' }, { accountId: '1000', containerId: '2000', triggerId: '10', name: 'Custom Event - Quipux Modal Events', type: 'customEvent', customEventFilter: [{ type: 'matchRegex', parameter: [{ type: 'template', key: 'arg0', value: '{{_event}}' }, { type: 'template', key: 'arg1', value: '^quipux_modal_.*$' }] }] }],
        variable: [{ accountId: '1000', containerId: '2000', variableId: '1', name: 'DLV - Modal Campaign ID', type: 'v', parameter: [{ type: 'integer', key: 'dataLayerVersion', value: '2' }, { type: 'template', key: 'name', value: 'modal.campaignId' }] }, { accountId: '1000', containerId: '2000', variableId: '2', name: 'DLV - Modal Slide Index', type: 'v', parameter: [{ type: 'integer', key: 'dataLayerVersion', value: '2' }, { type: 'template', key: 'name', value: 'modal.slideIndex' }] }, { accountId: '1000', containerId: '2000', variableId: '3', name: 'DLV - Modal CTA Text', type: 'v', parameter: [{ type: 'integer', key: 'dataLayerVersion', value: '2' }, { type: 'template', key: 'name', value: 'modal.ctaText' }] }, { accountId: '1000', containerId: '2000', variableId: '4', name: 'DLV - Modal Close Reason', type: 'v', parameter: [{ type: 'integer', key: 'dataLayerVersion', value: '2' }, { type: 'template', key: 'name', value: 'modal.closeReason' }] }]
      }
    };
    res.attachment(`gtm-workspace-${tenant}.json`).json(gtmExport);
  });

  return router;
};
