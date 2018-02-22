/* eslint-env jest */
// mock config module
const cfg = jest.genMockFromModule('../../src/config/index.js');

// test config
const testConfig = {
  endpoint: 'http://localhost:8080',
  endpoints: [
    {
      endpoint: 'http://test.endpoint',
      user: null,
      token: null,
    },
  ],
  token: 'test-token',
  user: {
    username: 'admin',
  },
};

// saved configs for re-use
const savedConfigs = {};

// mock config
let mockConfig = Object.assign({}, testConfig);

cfg.__save = key => {
  savedConfigs[key] = Object.assign({}, mockConfig);
};
cfg.__restore = key => {
  mockConfig = Object.assign({}, savedConfigs[key]);
};
cfg.updateConfig = newCfg => {
  mockConfig = Object.assign(mockConfig, newCfg);
};
cfg.isLoggedIn = () => {
  if (!mockConfig.user || !mockConfig.user.username) {
    return false;
  }
  return true;
};
cfg.logout = newCfg => {
  delete newCfg.user;
  delete newCfg.token;
  mockConfig = Object.assign({}, newCfg);
};
cfg.userConfig = mockConfig;

module.exports = cfg;
