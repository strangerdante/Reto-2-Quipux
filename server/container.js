const config = require('./config/app-config');
const { FileStore } = require('./infrastructure/file-store');
const { CampaignRepository } = require('./repositories/campaign-repository');
const { ManifestRepository } = require('./repositories/manifest-repository');
const { TenantRepository } = require('./repositories/tenant-repository');
const { LocalStorageProvider } = require('./services/storage-provider');
const { PublishingService } = require('./services/publishing-service');

const fileStore = new FileStore(config.storageRoot);

const manifestRepository = new ManifestRepository(fileStore);

const campaignRepository = new CampaignRepository(fileStore);

const tenantRepository = new TenantRepository(fileStore);

module.exports = {
  config,
  fileStore,
  campaignRepository,
  manifestRepository,
  tenantRepository,
  storageProvider: new LocalStorageProvider({ fileStore, config }),
  publishingService: new PublishingService({ manifestRepository, campaignRepository, config })
};
