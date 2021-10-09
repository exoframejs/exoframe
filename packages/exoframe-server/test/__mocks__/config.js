import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// build test paths
const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const baseFolder = path.join(currentDir, '..', '..', 'test', 'fixtures');
// const configPath = path.join(baseFolder, 'server.config.yml');
const publicKeysPath = path.join(currentDir, '..', '..', 'test', 'fixtures');
export const extensionsFolder = path.join(baseFolder, 'extensions');
export const recipesFolder = path.join(baseFolder, 'recipes');
const tempDirNormal = path.join(baseFolder, 'deploying');
export const pluginsFolder = path.join(baseFolder, 'plugins');
export const faasFolder = path.join(baseFolder, 'faas');
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
  traefikArgs: [],
  exoframeNetwork: 'exoframe',
  publicKeysPath,
};

// saved configs for re-use
const savedConfigs = {
  normal: Object.assign({}, testConfig),
  plugins: Object.assign({}, testConfig, {
    plugins: {
      install: ['testplugin'],
      testplugin: {
        test: 123,
      },
    },
  }),
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

try {
  await mkdir(faasFolder);
} catch {
  // do nothing
}
