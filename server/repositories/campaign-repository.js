const { safeSegment } = require('../infrastructure/file-store');

class CampaignRepository {
  constructor(fileStore) {
    this.fileStore = fileStore;
  }

  tenantId(value) {
    return safeSegment(value, 'valle');
  }

  filePath(tenantId) {
    return this.fileStore.path('tenants', this.tenantId(tenantId), 'campaigns.json');
  }

  async list(tenantId) {
    return this.fileStore.readJson(this.filePath(tenantId), []);
  }

  async find(tenantId, campaignId) {
    const campaigns = await this.list(tenantId);
    return campaigns.find(campaign => campaign.id === campaignId) || null;
  }

  async save(tenantId, campaign) {
    const tenant = this.tenantId(tenantId);
    return this.fileStore.runExclusive(`campaigns:${tenant}`, async () => {
      const campaigns = await this.list(tenant);
      const index = campaigns.findIndex(item => item.id === campaign.id);
      const next = [...campaigns];
      if (index >= 0) next[index] = { ...next[index], ...campaign };
      else next.unshift(campaign);
      await this.fileStore.writeJsonAtomic(this.filePath(tenant), next);
      return next[index >= 0 ? index : 0];
    });
  }

  async delete(tenantId, campaignId) {
    const tenant = this.tenantId(tenantId);
    return this.fileStore.runExclusive(`campaigns:${tenant}`, async () => {
      const campaigns = await this.list(tenant);
      const remaining = campaigns.filter(campaign => campaign.id !== campaignId);
      await this.fileStore.writeJsonAtomic(this.filePath(tenant), remaining);
      return remaining.length !== campaigns.length;
    });
  }
}

module.exports = { CampaignRepository };
