import path from 'path';
import { fileURLToPath } from 'url';

// build test paths
const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const baseFolder = path.join(currentDir, '..', '..', 'test', 'fixtures');
export const configPath = path.join(baseFolder, 'server.config.yml');
export const publicKeysPath = path.join(currentDir, '..', '..', 'test', 'fixtures');
export const extensionsFolder = path.join(baseFolder, 'extensions');
export const recipesFolder = path.join(baseFolder, 'recipes');
export const logFolder = baseFolder;
const tempDirNormal = path.join(baseFolder, 'deploying');
export let tempDockerDir = tempDirNormal;

// test config
const testConfig = {
  debug: true,
  letsencrypt: false,
  letsencryptEmail: 'test@gmail.com',
  baseDomain: 'test',
  cors: {
    origin: 'http://test.com',
  },
  compress: true,
  updateChannel: 'stable',
  traefikImage: 'traefik:latest',
  traefikName: 'exoframe-traefik',
  traefikLabels: {},
  traefikDisableGeneratedConfig: false,
  exoframeNetwork: 'exoframe',
  publicKeysPath,
};

// saved configs for re-use
const savedConfigs = {
  normal: Object.assign({}, testConfig),
};
const savedDirs = {
  normal: tempDirNormal,
};

// mock config
let mockConfig = Object.assign({}, testConfig);

// method to load defined config
export const __load = (key) => {
  mockConfig = Object.assign({}, savedConfigs[key]);
  tempDockerDir = savedDirs[key];
};
// default get config method that returns mock config
export const getConfig = () => mockConfig;
export const waitForConfig = async () => true;
