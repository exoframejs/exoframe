// npm packages
import os from 'os';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// construct paths
const baseFolder = path.join(os.homedir(), '.exoframe');
const configPath = path.join(baseFolder, 'cli.config.yml');

const defaultConfig = {
  endpoint: 'http://localhost:3000',
};

// default config
let userConfig = defaultConfig; // eslint-disable-line

// create user config if doesn't exist
try {
  fs.statSync(configPath);
} catch (e) {
  fs.writeFileSync(configPath, yaml.safeDump(defaultConfig), 'utf8');
}

// load
try {
  userConfig = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
  console.error('Error parsing user config:', e);
}

export const updateConfig = (newCfg) => {
  const cfg = {...newCfg, ...userConfig};
  fs.writeFileSync(configPath, yaml.safeDump(cfg), 'utf8');
};

// latest config from file
export default userConfig;
