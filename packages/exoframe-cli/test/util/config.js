import chalk from 'chalk';
import fs from 'fs';
import jsyaml from 'js-yaml';
import os from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { vi } from 'vitest';
import { fixturesFolder, testFolder } from './paths.js';

const clone = (value) => JSON.parse(JSON.stringify(value));
const createDefaultUserConfig = (addUser = true) => {
  const cfg = { endpoint: 'http://localhost:8080' };
  if (addUser) {
    cfg.user = { username: 'admin' };
    cfg.token = 'test-token';
  }
  return cfg;
};

const configModulePath = fileURLToPath(new URL('../../src/config/index.js', import.meta.url));
let mockedUserConfig = null;
let mockedUserConfigDefaults = null;

const mockConfigModule = (addUser = true) => {
  mockedUserConfigDefaults = createDefaultUserConfig(addUser);
  mockedUserConfig = clone(mockedUserConfigDefaults);

  const getConfig = vi.fn(async () => clone(mockedUserConfig));
  const updateConfig = vi.fn(async (newCfg) => {
    mockedUserConfig = Object.assign(mockedUserConfig, newCfg);
    return clone(mockedUserConfig);
  });
  const logout = vi.fn(async () => {
    delete mockedUserConfig.user;
    delete mockedUserConfig.token;
  });
  const isLoggedIn = vi.fn(async () => {
    const loggedIn = Boolean(mockedUserConfig.user?.username);
    if (!loggedIn) {
      console.log(chalk.red('Error: not logged in!'), 'Please, login first!');
    }
    return loggedIn;
  });

  vi.doMock(configModulePath, () => ({ getConfig, updateConfig, logout, isLoggedIn }));

  return () => {
    vi.doUnmock(configModulePath);
    mockedUserConfig = null;
    mockedUserConfigDefaults = null;
  };
};

vi.mock('ora', () => {
  const fn = (...args) => {
    if (args.length > 0) {
      console.log(...args);
    }
    return self;
  };
  const self = { start: fn, fail: fn, succeed: fn, warn: fn };
  return {
    default: (msg) => {
      fn(msg);
      return self;
    },
  };
});

export const setupDeployMocks = ({ addUser = true, mockConfig = true } = {}) => {
  // mock current work dir
  const prevXdgConfig = process.env.XDG_CONFIG_HOME;
  process.env.XDG_CONFIG_HOME = join(fixturesFolder, '.config');
  const cwdSpy = vi.spyOn(process, 'cwd').mockImplementation(() => fixturesFolder);
  const osSpy = vi.spyOn(os, 'homedir').mockImplementation(() => fixturesFolder);
  const exitMock = vi.spyOn(process, 'exit').mockImplementation(() => {});
  const restoreConfigMock = mockConfig ? mockConfigModule(addUser) : null;

  return () => {
    process.env.XDG_CONFIG_HOME = prevXdgConfig;
    cwdSpy.mockRestore();
    osSpy.mockRestore();
    exitMock.mockRestore();
    restoreConfigMock?.();
  };
};

const defaultSetupOptions = { addUser: true, mockConfig: true };
const normalizeSetupOptions = (firstArg, maybeOptions = {}) => {
  if (typeof firstArg === 'object') {
    return { ...defaultSetupOptions, ...firstArg };
  }
  if (typeof firstArg === 'boolean') {
    const optionOverrides = Object.hasOwn(maybeOptions, 'mockConfig') ? { mockConfig: maybeOptions.mockConfig } : {};
    return { ...defaultSetupOptions, addUser: firstArg, ...optionOverrides };
  }
  return { ...defaultSetupOptions };
};

export const setupMocks = (addUserOrOptions = true, options = {}) => {
  const { addUser, mockConfig } = normalizeSetupOptions(addUserOrOptions, options);
  // mock current work dir
  const cwdSpy = vi.spyOn(process, 'cwd').mockImplementation(() => testFolder);
  const osSpy = vi.spyOn(os, 'homedir').mockImplementation(() => testFolder);

  let exoConfigExists = true;
  let exoConfig = { name: 'test' };
  let userConfig = null;
  if (!mockConfig) {
    userConfig = jsyaml.dump(createDefaultUserConfig(addUser));
  }
  const restoreConfigMock = mockConfig ? mockConfigModule(addUser) : null;

  const mkdirSpy = vi.spyOn(fs.promises, 'mkdir').mockImplementation(async () => {});
  const statSpy = vi.spyOn(fs.promises, 'stat').mockImplementation(async (path) => {
    // console.log('stat', path);
    if (path.includes('exoframe.json') && !exoConfigExists) {
      throw new Error('ENOENT Does not exist');
    }
  });
  const rfSpy = vi.spyOn(fs.promises, 'readFile').mockImplementation(async (path) => {
    // console.log('readfile', { path, userConfig, exoConfig });
    if ((typeof path === 'string' && path.includes('.json')) || path.href?.includes('.json')) {
      return Buffer.from(JSON.stringify(exoConfig));
    }
    if (!mockConfig && ((typeof path === 'string' && path.includes('.yml')) || path.href?.includes('.yml'))) {
      return Buffer.from(userConfig);
    }
    return fs.readFileSync(path);
  });
  const wfSpy = vi.spyOn(fs.promises, 'writeFile').mockImplementation(async (path, string) => {
    // console.log('writefile', { path, string });
    if (path.includes('.json')) {
      exoConfig = JSON.parse(string);
      exoConfigExists = true;
      return;
    }
    if (!mockConfig && path.includes('.yml')) {
      userConfig = string;
    }
  });
  const ulSpy = vi.spyOn(fs.promises, 'unlink').mockImplementation(async (path) => {
    // console.log('unlink', { path, string });
    if (path.includes('exoframe.json')) {
      exoConfigExists = false;
    }
  });

  return () => {
    cwdSpy.mockRestore();
    osSpy.mockRestore();
    mkdirSpy.mockRestore();
    statSpy.mockRestore();
    rfSpy.mockRestore();
    wfSpy.mockRestore();
    ulSpy.mockRestore();
    restoreConfigMock?.();
  };
};

export const getConfig = async () => {
  const str = await fs.promises.readFile(join(testFolder, 'exoframe.json'), 'utf-8');
  const cfg = JSON.parse(str);
  return cfg;
};

export const getUserConfig = async () => {
  if (mockedUserConfig) {
    return clone(mockedUserConfig);
  }
  const xdgConfigFolder = process.env.XDG_CONFIG_HOME || join(os.homedir(), '.config');
  const baseFolder = join(xdgConfigFolder, 'exoframe');
  const configPath = join(baseFolder, 'cli.config.yml');
  const str = await fs.promises.readFile(configPath, 'utf-8');
  const cfg = jsyaml.load(str);
  return cfg;
};

export const resetUserConfig = async () => {
  if (mockedUserConfig && mockedUserConfigDefaults) {
    mockedUserConfig = clone(mockedUserConfigDefaults);
    return;
  }
  const xdgConfigFolder = process.env.XDG_CONFIG_HOME || join(os.homedir(), '.config');
  const baseFolder = join(xdgConfigFolder, 'exoframe');
  const configPath = join(baseFolder, 'cli.config.yml');
  await fs.promises.writeFile(configPath, jsyaml.dump(createDefaultUserConfig(true)), 'utf-8');
};

export const removeConfig = async () => {
  await fs.promises.unlink(join(testFolder, 'exoframe.json'));
};

export const resetConfig = async () => {
  await fs.promises.writeFile(join(testFolder, 'exoframe.json'), JSON.stringify({ name: 'test' }));
};
