import chalk from 'chalk';
import { mkdir, readFile, stat, writeFile } from 'fs/promises';
import jsyaml from 'js-yaml';
import { homedir } from 'os';
import { join } from 'path';

// TODO:
// this needs some refactoring to make it load config on any
// new instantiation of program
// currently reading only first time causes some issues with tests

// construct paths
const xdgConfigFolder = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
const baseFolder = join(xdgConfigFolder, 'exoframe');
const configPath = join(baseFolder, 'cli.config.yml');

const defaultConfig = {
  endpoint: 'http://localhost:8080',
};

// default config
let userConfig = defaultConfig;

// create config folder if doesn't exist
try {
  await stat(baseFolder);
} catch (e) {
  await mkdir(baseFolder);
}

// create user config if doesn't exist
try {
  await stat(configPath);
} catch (e) {
  await writeFile(configPath, jsyaml.dump(defaultConfig), 'utf8');
}

// load
try {
  const newCfg = jsyaml.load(await readFile(configPath, 'utf8'));
  // assign new config and clean endpoint url
  userConfig = Object.assign(newCfg, {
    endpoint: newCfg.endpoint.replace(/\/$/, ''),
  });
} catch (e) {
  console.error('Error parsing user config:', e);
}

export async function updateConfig(newCfg) {
  const cfg = Object.assign(userConfig, newCfg);
  await writeFile(configPath, jsyaml.dump(cfg), 'utf8');
}

export function isLoggedIn() {
  if (!userConfig.user || !userConfig.user.username) {
    console.log(chalk.red('Error: not logged in!'), 'Please, login first!');
    return false;
  }

  return true;
}

export async function logout(cfg) {
  delete cfg.user;
  delete cfg.token;
  await updateConfig(cfg);
}

export function getConfig() {
  return userConfig;
}
