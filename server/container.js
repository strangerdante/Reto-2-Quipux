const config = require('./config/app-config');
const { FileStore } = require('./infrastructure/file-store');
const { CampaignRepository } = require('./repositories/campaign-repository');
const { ManifestRepository } = require('./repositories/manifest-repository');
const { LocalStorageProvider } = require('./services/storage-provider');
const { PublishingService } = require('./services/publishing-service');

const fileStore = new FileStore(config.storageRoot);

const manifestRepository = new ManifestRepository(fileStore);

module.exports = {
  config,
  fileStore,
  campaignRepository: new CampaignRepository(fileStore),
  manifestRepository,
  storageProvider: new LocalStorageProvider({ fileStore, config }),
  publishingService: new PublishingService({ manifestRepository, config })
};
