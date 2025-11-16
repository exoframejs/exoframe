// npm packages
import { spawn } from 'child_process';
import { mkdirSync, readFileSync, statSync, watchFile, writeFileSync } from 'fs';
import jsyaml from 'js-yaml';
import { join } from 'path';
import logger from '../logger/index.js';
import { baseFolder, configPath, extensionsFolder, logFolder, publicKeysPath, recipesFolder } from './paths.js';

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
