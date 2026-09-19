function isSafeCtaUrl(value) {
  const link = String(value || '').trim();
  if (!link || link === '#') return true;
  if (link.startsWith('//')) return false; // AC-19: Bloquear protocolo relativo
  return link.startsWith('https://') || (link.startsWith('/') && !link.startsWith('//'));
}

class PublishingService {
  constructor({ manifestRepository, campaignRepository, config }) {
    this.manifestRepository = manifestRepository;
    this.campaignRepository = campaignRepository;
    this.config = config;
  }

  preflight(campaign) {
    const slides = Array.isArray(campaign.slides) ? campaign.slides : [];
    const insecureLinks = slides.filter(slide => !isSafeCtaUrl(slide.link)).length;
    const missingImages = slides.filter(slide => !slide.desktopPreview && !slide.desktopName).length;
    return [
      { id: 'slides-count', label: 'Slides de contenido', detail: slides.length ? `${slides.length} slide(s) configurado(s)` : 'Debe tener al menos 1 slide', passed: slides.length > 0 },
      { id: 'https-security', label: 'Protocolo de enlaces CTA seguro (HTTPS)', detail: insecureLinks === 0 ? 'Todos los enlaces cumplen HTTPS o ruta relativa' : `${insecureLinks} enlace(s) no usan HTTPS`, passed: insecureLinks === 0 },
      { id: 'images-loaded', label: 'Recursos multimedia asignados', detail: missingImages === 0 ? 'Todas las diapositivas cuentan con imagen' : `${missingImages} slide(s) sin imagen desktop`, passed: missingImages === 0 }
    ];
  }

  buildManifest({ campaign, tenant, version, author, summary }) {
    const versionString = `v${version}`;
    return {
      id: campaign.id,
      tenantId: tenant,
      version,
      versionString,
      publishedAt: new Date().toISOString(),
      publishedBy: author || { name: 'Angie Ríos', role: 'Frontend Lead', id: 'AR' },
      summary: summary || `Publicación ${versionString} - ${campaign.name}`,
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
      slides: (campaign.slides || []).map((slide, index) => ({
        id: slide.id || index + 1,
        order: index + 1,
        active: slide.active !== false,
        title: slide.title || '',
        description: slide.description || '',
        cta: slide.cta || 'Conocer más',
        link: slide.link || '#',
        target: slide.target === '_self' ? '_self' : '_blank',
        alt: slide.alt || slide.title || 'Slide de popup',
        desktopImage: slide.desktopPreview || slide.desktopName || '',
        mobileImage: slide.mobilePreview || slide.mobileName || slide.desktopPreview || ''
      }))
    };
  }

  async listVersions(tenant, campaignId) {
    const [entries, active] = await Promise.all([
      this.manifestRepository.listVersionManifests(tenant, campaignId),
      this.manifestRepository.getActive(tenant, campaignId)
    ]);
    const activeVersion = Number(active?.version);
    return entries
      .map(({ manifest, filename }) => {
        const rawVersion = Number(manifest.version) || Number(filename.match(/\d+/)?.[0]);
        const versionNumber = Number.isInteger(rawVersion) ? rawVersion : 1;
        return {
          id: `ver-${versionNumber}`,
          version: `v${versionNumber}`,
          author: manifest.publishedBy ? `${manifest.publishedBy.name} · ${manifest.publishedBy.role}` : 'Administrador',
          timestamp: manifest.publishedAt ? new Date(manifest.publishedAt).toLocaleString('es-CO') : 'Reciente',
          summary: manifest.summary || `Publicación v${versionNumber} con ${manifest.slides?.length || 0} slide(s)`,
          isCurrent: versionNumber === activeVersion,
          snapshot: manifest
        };
      })
      .sort((a, b) => Number(b.version.slice(1)) - Number(a.version.slice(1)));
  }

  async publish({ campaign, tenant, author }) {
    const preflights = this.preflight(campaign);
    if (!preflights.every(check => check.passed)) return { success: false, preflights };

    const resolvedTenant = this.manifestRepository.tenantId(tenant);
    return this.manifestRepository.withCampaignLock(resolvedTenant, campaign.id, async () => {
      const version = await this.manifestRepository.nextVersion(resolvedTenant, campaign.id);
      const manifest = this.buildManifest({ campaign, tenant: resolvedTenant, version, author });
      await this.manifestRepository.writeRelease(resolvedTenant, campaign.id, manifest);
      await this.manifestRepository.appendAudit(resolvedTenant, {
        action: 'PUBLICACIÓN', campaignId: campaign.id, campaignName: campaign.name,
        version: manifest.versionString, user: manifest.publishedBy.name, role: manifest.publishedBy.role
      });
      if (this.campaignRepository) {
        const existing = await this.campaignRepository.find(resolvedTenant, campaign.id) || campaign;
        await this.campaignRepository.save(resolvedTenant, {
          ...existing,
          ...campaign,
          status: 'Publicado',
          version: manifest.versionString,
          updated: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
        });
      }
      return { success: true, version: manifest.versionString, versionNum: version, manifest, preflights, activeUrl: this.config.manifestUrl(resolvedTenant, campaign.id) };
    });
  }

  async rollback({ tenant, campaignId, targetVersion, author }) {
    const cleanVersion = Number(String(targetVersion || '').replace(/[^0-9]/g, ''));
    if (!Number.isInteger(cleanVersion) || cleanVersion < 1) return null;
    const resolvedTenant = this.manifestRepository.tenantId(tenant);
    return this.manifestRepository.withCampaignLock(resolvedTenant, campaignId, async () => {
      const snapshot = await this.manifestRepository.getVersion(resolvedTenant, campaignId, cleanVersion);
      if (!snapshot) return null;
      const newVersion = await this.manifestRepository.nextVersion(resolvedTenant, campaignId);
      const restoredManifest = {
        ...snapshot,
        version: newVersion,
        versionString: `v${newVersion}`,
        publishedAt: new Date().toISOString(),
        publishedBy: author || { name: 'Angie Ríos', role: 'Frontend Lead', id: 'AR' },
        summary: `Reversión a contenido de v${cleanVersion}`
      };
      await this.manifestRepository.writeRelease(resolvedTenant, campaignId, restoredManifest);
      await this.manifestRepository.appendAudit(resolvedTenant, {
        action: 'REVERSIÓN', campaignId, campaignName: restoredManifest.summary,
        version: `v${newVersion} (restaurada de v${cleanVersion})`, user: restoredManifest.publishedBy.name, role: restoredManifest.publishedBy.role
      });
      if (this.campaignRepository) {
        const existing = await this.campaignRepository.find(resolvedTenant, campaignId);
        if (existing) {
          await this.campaignRepository.save(resolvedTenant, {
            ...existing,
            status: 'Publicado',
            version: `v${newVersion}`,
            updated: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }),
            layout: restoredManifest.layout || existing.layout,
            rules: restoredManifest.rules ? { ...existing.rules, ...restoredManifest.rules } : existing.rules
          });
        }
      }
      return { newVersion: `v${newVersion}`, restoredFrom: `v${cleanVersion}`, manifest: restoredManifest };
    });
  }
}

module.exports = { PublishingService };
