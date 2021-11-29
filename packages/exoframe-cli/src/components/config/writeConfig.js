import { writeFile } from 'fs/promises';

export const writeConfig = async (configPath, newConfig) => {
  // init config object
  const config = { name: newConfig.name };
  if (newConfig?.restart?.length) {
    config.restart = newConfig.restart;
  }
  if (newConfig?.domain?.length) {
    config.domain = newConfig.domain;
  }
  if (newConfig?.port?.length) {
    config.port = newConfig.port;
  }
  if (newConfig?.project?.length) {
    config.project = newConfig.project;
  }
  if (newConfig.env && Object.keys(newConfig.env).length) {
    config.env = newConfig.env;
  }
  if (newConfig.labels && Object.keys(newConfig.labels).length) {
    config.labels = newConfig.labels;
  }
  if (newConfig?.volumes?.length) {
    config.volumes = newConfig.volumes;
  }
  if (newConfig?.rateLimit?.average && newConfig?.rateLimit?.burst) {
    config.rateLimit = {
      average: newConfig.rateLimit.average,
      burst: newConfig.rateLimit.burst,
    };
  }
  if (newConfig?.hostname?.length) {
    config.hostname = newConfig.hostname;
  }
  if (newConfig?.template?.length) {
    config.template = newConfig.template;
  }
  if (newConfig.compress !== undefined) {
    config.compress = newConfig.compress;
  }
  if (newConfig.letsencrypt !== undefined) {
    config.letsencrypt = newConfig.letsencrypt;
  }
  if (newConfig?.image?.length) {
    config.image = newConfig.image;
  }
  if (newConfig?.imageFile?.length) {
    config.imageFile = newConfig.imageFile;
  }
  if (newConfig?.basicAuth?.length) {
    config.basicAuth = newConfig.basicAuth;
  }

  // write config
  await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
};
