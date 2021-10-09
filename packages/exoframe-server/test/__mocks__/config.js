/* eslint-env jest */
// mock config module
const cfg = jest.genMockFromModule('../../src/config/index.js');

// npm modules
const path = require('path');

// build test paths
const baseFolder = path.join(__dirname, '..', '..', 'test', 'fixtures');
// const configPath = path.join(baseFolder, 'server.config.yml');
const publicKeysPath = path.join(__dirname, '..', '..', 'test', 'fixtures');
const extensionsFolder = path.join(baseFolder, 'extensions');
const recipesFolder = path.join(baseFolder, 'recipes');
const tempDirNormal = path.join(baseFolder, 'deploying');
const pluginsFolder = path.join(baseFolder, 'plugins');

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
cfg.__load = (key) => {
  mockConfig = Object.assign({}, savedConfigs[key]);
  cfg.tempDockerDir = savedDirs[key];
};
// default get config method that returns mock config
cfg.getConfig = () => mockConfig;
// export paths for others
cfg.baseFolder = baseFolder;
cfg.extensionsFolder = extensionsFolder;
cfg.recipesFolder = recipesFolder;
cfg.tempDockerDir = tempDirNormal;
cfg.pluginsFolder = pluginsFolder;

export default cfg;
