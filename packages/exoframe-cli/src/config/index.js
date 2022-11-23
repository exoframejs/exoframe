import chalk from 'chalk';
import { mkdir, readFile, stat, writeFile } from 'fs/promises';
import jsyaml from 'js-yaml';
import { homedir } from 'os';
import { join } from 'path';

// construct paths
const xdgConfigFolder = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
const baseFolder = join(xdgConfigFolder, 'exoframe');
const configPath = join(baseFolder, 'cli.config.yml');

/**
 * User config
 * @typedef {object} EndpointConfig
 * @property {string} endpoint - endpoint URL
 * @property {object} [user] - user associated with endpoint
 * @property {string} [user.username] - username of the user associated with endpoint
 * @property {string} [token] - auth token associated with endpoint
 */

/**
 * User config
 * @typedef {object} UserConfig
 * @property {string} endpoint - endpoint URL
 * @property {object} [user] - current user data
 * @property {string} [user.username] - current user username
 * @property {string} [token] - current user auth token
 * @property {EndpointConfig[]} [endpoints] - list of all saved endpoints
 */

/**
 * Default config object, used if no user config present
 * @type{UserConfig}
 */
const defaultConfig = {
  endpoint: 'http://localhost:8080',
};

/**
 * Load user config from disk
 * @returns {Promise<UserConfig>} User config
 */
export async function getConfig() {
  // copy default config
  let userConfig = structuredClone(defaultConfig);

  // create config folder if doesn't exist
  try {
    await stat(baseFolder);
  } catch (e) {
    await mkdir(baseFolder);
  }

  // create default user config if doesn't exist
  try {
    await stat(configPath);
  } catch (e) {
    // write default config to file
    await writeFile(configPath, jsyaml.dump(userConfig), 'utf8');
    // return it
    return userConfig;
  }

  // load config from file
  try {
    const newCfg = jsyaml.load(await readFile(configPath, 'utf8'));
    // assign new config and clean endpoint url
    userConfig = Object.assign(newCfg, {
      endpoint: newCfg.endpoint.replace(/\/$/, ''),
    });
    return userConfig;
  } catch (e) {
    console.error('Error parsing user config:', e);
    throw e;
  }
}

/**
 * Updates current user config with new data
 * @param {UserConfig} newCfg new config to write
 * @returns {Promise<void>}
 */
export async function updateConfig(newCfg) {
  const cfg = Object.assign(defaultConfig, newCfg);
  await writeFile(configPath, jsyaml.dump(cfg), 'utf8');
}

/**
 * Check if current user is logged in
 * @returns {Promise<Boolean>} if current user is logged in
 */
export async function isLoggedIn() {
  const userConfig = await getConfig();
  if (!userConfig.user || !userConfig.user.username) {
    console.log(chalk.red('Error: not logged in!'), 'Please, login first!');
    return false;
  }

  return true;
}

/**
 * Logs out current user
 * @returns {Promise<void>}
 */
export async function logout() {
  const userConfig = await getConfig();
  delete userConfig.user;
  delete userConfig.token;
  await updateConfig(userConfig);
}
