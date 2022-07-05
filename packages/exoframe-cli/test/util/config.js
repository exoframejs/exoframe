import fs from 'fs';
import jsyaml from 'js-yaml';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { vi } from 'vitest';

export const baseFolder = path.dirname(fileURLToPath(import.meta.url));
export const fixturesFolder = path.join(baseFolder, '..', 'fixtures');
export const testFolder = path.join(fixturesFolder, 'config-test');

// mock current work dir
vi.spyOn(process, 'cwd').mockImplementation(() => testFolder);

vi.spyOn(os, 'homedir').mockImplementation(() => testFolder);

let exoConfig = { name: 'test' };
let userConfig = jsyaml.dump({ endpoint: 'http://localhost:8080' });

vi.spyOn(fs.promises, 'mkdir').mockImplementation(async () => {});
vi.spyOn(fs.promises, 'stat').mockImplementation(async () => {});
vi.spyOn(fs.promises, 'readFile').mockImplementation(async (path) => {
  // console.log('readfile', { path, userConfig, exoConfig });
  if (path.includes('.json')) {
    return Buffer.from(JSON.stringify(exoConfig));
  }
  return Buffer.from(userConfig);
});
vi.spyOn(fs.promises, 'writeFile').mockImplementation(async (path, string) => {
  // console.log('writefile', { path, string });
  if (path.includes('.json')) {
    exoConfig = JSON.parse(string);
    return;
  }
  userConfig = string;
});

export const getConfig = async () => {
  const str = await fs.promises.readFile(path.join(testFolder, 'exoframe.json'), 'utf-8');
  const cfg = JSON.parse(str);
  return cfg;
};

export const getUserConfig = async () => {
  const str = await fs.promises.readFile(path.join(testFolder, 'cli.config.yml'), 'utf-8');
  const cfg = jsyaml.load(str);
  return cfg;
};

export const resetConfig = async () => {
  await fs.promises.writeFile(path.join(testFolder, 'exoframe.json'), JSON.stringify({ name: 'test' }));
};
