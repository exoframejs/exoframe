import fs from 'fs';
import jsyaml from 'js-yaml';
import os from 'os';
import { join } from 'path';
import { vi } from 'vitest';
import { testFolder } from './paths.js';

export const setupMocks = () => {
  // mock current work dir
  const cwdSpy = vi.spyOn(process, 'cwd').mockImplementation(() => testFolder);
  const osSpy = vi.spyOn(os, 'homedir').mockImplementation(() => testFolder);

  let exoConfig = { name: 'test' };
  let userConfig = jsyaml.dump({ endpoint: 'http://localhost:8080' });

  const mkdirSpy = vi.spyOn(fs.promises, 'mkdir').mockImplementation(async () => {
    return;
  });
  const statSpy = vi.spyOn(fs.promises, 'stat').mockImplementation(async () => {
    return;
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
      return;
    }
    userConfig = string;
  });

  return () => {
    cwdSpy.mockRestore();
    osSpy.mockRestore();
    mkdirSpy.mockRestore();
    statSpy.mockRestore();
    rfSpy.mockRestore();
    wfSpy.mockRestore();
  };
};

export const getConfig = async () => {
  const str = await fs.promises.readFile(join(testFolder, 'exoframe.json'), 'utf-8');
  const cfg = JSON.parse(str);
  return cfg;
};

export const getUserConfig = async () => {
  const str = await fs.promises.readFile(join(testFolder, 'cli.config.yml'), 'utf-8');
  const cfg = jsyaml.load(str);
  return cfg;
};

export const resetConfig = async () => {
  await fs.promises.writeFile(join(testFolder, 'exoframe.json'), JSON.stringify({ name: 'test' }));
};
