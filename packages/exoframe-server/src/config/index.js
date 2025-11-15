// npm packages
import { spawn } from 'child_process';
import { mkdirSync, readFileSync, statSync, watchFile, writeFileSync } from 'fs';
import jsyaml from 'js-yaml';
import { homedir } from 'os';
import { join } from 'path';
import logger from '../logger/index.js';

// construct paths
const xdgConfigHome = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
export const baseFolder = join(xdgConfigHome, 'exoframe');
const configPath = join(baseFolder, 'server.config.yml');
const publicKeysPath = join(homedir(), '.ssh');
export const extensionsFolder = join(baseFolder, 'extensions');
export const recipesFolder = join(baseFolder, 'recipes');
// dir for temporary files used to build docker images
export const tempDockerDir = join(baseFolder, 'deploying');

// create base folder if doesn't exist
try {
  statSync(baseFolder);
} catch {
  mkdirSync(baseFolder);
}

// create extensions folder if doesn't exist
try {
  statSync(extensionsFolder);
} catch {
  mkdirSync(extensionsFolder);
}
// init package.json if it doesn't exist
try {
  statSync(join(extensionsFolder, 'package.json'));
} catch {
  spawn('npm', ['init', '-y', '--silent'], { cwd: extensionsFolder });
}

// create recipes folder if doesn't exist
try {
  statSync(recipesFolder);
} catch {
  mkdirSync(recipesFolder);
}
// init package.json if it doesn't exist
try {
  statSync(join(recipesFolder, 'package.json'));
} catch {
  spawn('npm', ['init', '-y', '--silent'], { cwd: recipesFolder });
}

// construct log path
export const logFolder = join(xdgConfigHome, 'exoframe', 'exoframe-server');

// create logs folder if doesn't exist
try {
  statSync(logFolder);
} catch {
  mkdirSync(logFolder);
}

// default config
const defaultConfig = {
  debug: false,
  letsencrypt: false,
  letsencryptEmail: 'admin@domain.com',
  compress: true,
  autoprune: false,
  baseDomain: false,
  cors: false,
  updateChannel: 'stable',
  traefikImage: 'traefik:latest',
  traefikName: 'exoframe-traefik',
  traefikLabels: {},
  traefikDisableGeneratedConfig: false,
  exoframeNetwork: 'exoframe',
  publicKeysPath,
};

// default config
let userConfig = defaultConfig;

// config loaded promise
let loadedResolve = () => {};
const isConfigLoaded = new Promise((resolve) => {
  loadedResolve = resolve;
});

// reload function
const reloadUserConfig = () => {
  // mon
  try {
    userConfig = Object.assign(defaultConfig, jsyaml.load(readFileSync(configPath, 'utf8')));
    logger.debug('loaded new config:', userConfig);
    loadedResolve();
  } catch (e) {
    if (e.code === 'ENOENT') {
      logger.warn('no config found, using default values..');
    } else {
      logger.error('error parsing user config:', e);
    }
  }
};

if (process.env.NODE_ENV !== 'testing') {
  // create user config if doesn't exist
  try {
    statSync(configPath);
  } catch {
    writeFileSync(configPath, jsyaml.dump(defaultConfig), 'utf8');
  }

  // monitor config for changes if not running in test mode
  watchFile(configPath, reloadUserConfig);
}

// trigger initial load
reloadUserConfig();

// function to get latest config read config file
export function getConfig() {
  return userConfig;
}
export function waitForConfig() {
  return isConfigLoaded;
}
