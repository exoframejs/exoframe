import fs from 'fs';
import jsyaml from 'js-yaml';
import os from 'os';
import { join } from 'path';
import { vi } from 'vitest';
import { fixturesFolder, testFolder } from './paths.js';

vi.mock('ora', () => {
  const fn = (...args) => {
    if (args.length > 0) {
      console.log(...args);
    }
    return self;
  };
  const self = {
    start: fn,
    fail: fn,
    succeed: fn,
  };
  return {
    default: (msg) => {
      fn(msg);
      return self;
    },
  };
});

export const setupDeployMocks = () => {
  // mock current work dir
  process.env.XDG_CONFIG_HOME = join(fixturesFolder, '.config');
  const cwdSpy = vi.spyOn(process, 'cwd').mockImplementation(() => fixturesFolder);
  const osSpy = vi.spyOn(os, 'homedir').mockImplementation(() => fixturesFolder);
  const exitMock = vi.spyOn(process, 'exit').mockImplementation(() => {});

  return () => {
    cwdSpy.mockRestore();
    osSpy.mockRestore();
    exitMock.mockRestore();
  };
};

export const setupMocks = (addUser = true) => {
  // mock current work dir
  const cwdSpy = vi.spyOn(process, 'cwd').mockImplementation(() => testFolder);
  const osSpy = vi.spyOn(os, 'homedir').mockImplementation(() => testFolder);

  let exoConfigExists = true;
  let exoConfig = { name: 'test' };
  const defaultUserConfig = { endpoint: 'http://localhost:8080' };
  if (addUser) {
    defaultUserConfig.user = { username: 'admin' };
    defaultUserConfig.token = 'test-token';
  }
  let userConfig = jsyaml.dump(defaultUserConfig);

  const mkdirSpy = vi.spyOn(fs.promises, 'mkdir').mockImplementation(async () => {});
  const statSpy = vi.spyOn(fs.promises, 'stat').mockImplementation(async (path) => {
    // console.log('stat', path);
    if (path.includes('exoframe.json') && !exoConfigExists) {
      throw new Error('ENOENT Does not exist');
    }
  });
  const rfSpy = vi.spyOn(fs.promises, 'readFile').mockImplementation(async (path) => {
    // console.log('readfile', { path, userConfig, exoConfig });
    if (path.includes('.json')) {
      return Buffer.from(JSON.stringify(exoConfig));
    }
    if (path.includes('.yml')) {
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
    userConfig = string;
  });
  const ulSpy = vi.spyOn(fs.promises, 'unlink').mockImplementation(async (path, string) => {
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
  };
};

export const getConfig = async () => {
  const str = await fs.promises.readFile(join(testFolder, 'exoframe.json'), 'utf-8');
  const cfg = JSON.parse(str);
  return cfg;
};

export const getUserConfig = async () => {
  const xdgConfigFolder = process.env.XDG_CONFIG_HOME || join(os.homedir(), '.config');
  const baseFolder = join(xdgConfigFolder, 'exoframe');
  const configPath = join(baseFolder, 'cli.config.yml');
  const str = await fs.promises.readFile(configPath, 'utf-8');
  const cfg = jsyaml.load(str);
  return cfg;
};

export const resetUserConfig = async () => {
  const xdgConfigFolder = process.env.XDG_CONFIG_HOME || join(os.homedir(), '.config');
  const baseFolder = join(xdgConfigFolder, 'exoframe');
  const configPath = join(baseFolder, 'cli.config.yml');
  await fs.promises.writeFile(
    configPath,
    jsyaml.dump({
      endpoint: 'http://localhost:8080',
      user: { username: 'admin' },
      token: 'test-token',
    }),
    'utf-8'
  );
};

export const removeConfig = async () => {
  await fs.promises.unlink(join(testFolder, 'exoframe.json'));
};

export const resetConfig = async () => {
  await fs.promises.writeFile(join(testFolder, 'exoframe.json'), JSON.stringify({ name: 'test' }));
};
