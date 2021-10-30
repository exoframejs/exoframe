import chalk from 'chalk';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import jsyaml from 'js-yaml';
import { homedir } from 'os';
import { join } from 'path';

// construct paths
const xdgConfigFolder = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
const baseFolder = join(xdgConfigFolder, '.exoframe');
const configPath = join(baseFolder, 'cli.config.yml');

const defaultConfig = {
  endpoint: 'http://localhost:8080',
};

// default config
let userConfig = defaultConfig;

// create config folder if doesn't exist
try {
  statSync(baseFolder);
} catch (e) {
  mkdirSync(baseFolder);
}

// create user config if doesn't exist
try {
  statSync(configPath);
} catch (e) {
  writeFileSync(configPath, jsyaml.dump(defaultConfig), 'utf8');
}

// load
try {
  const newCfg = jsyaml.load(readFileSync(configPath, 'utf8'));
  // assign new config and clean endpoint url
  userConfig = Object.assign(newCfg, {
    endpoint: newCfg.endpoint.replace(/\/$/, ''),
  });
} catch (e) {
  console.error('Error parsing user config:', e);
}

export function updateConfig(newCfg) {
  const cfg = Object.assign(userConfig, newCfg);
  writeFileSync(configPath, jsyaml.dump(cfg), 'utf8');
}

export function isLoggedIn() {
  if (!userConfig.user || !userConfig.user.username) {
    console.log(chalk.red('Error: not logged in!'), 'Please, login first!');
    return false;
  }

  return true;
}

export function logout(cfg) {
  delete cfg.user;
  delete cfg.token;
  updateConfig(cfg);
}

export function getConfig() {
  return userConfig;
}
