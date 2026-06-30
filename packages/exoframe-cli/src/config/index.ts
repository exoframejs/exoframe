import chalk from 'chalk';
import { mkdir, readFile, stat, writeFile } from 'fs/promises';
import * as jsyaml from 'js-yaml';
import { homedir } from 'os';
import { join } from 'path';
import type { CliUserConfig } from '../types.ts';

// construct paths
const xdgConfigFolder = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
const baseFolder = join(xdgConfigFolder, 'exoframe');
const configPath = join(baseFolder, 'cli.config.yml');

const defaultConfig: CliUserConfig = { endpoint: 'http://localhost:8080' };

const normalizeEndpoint = (endpoint: string) => endpoint.replace(/\/$/, '');

const normalizeConfig = (config: Partial<CliUserConfig> | null | undefined): CliUserConfig => {
  const endpoint = normalizeEndpoint(config?.endpoint ?? defaultConfig.endpoint);
  const endpoints =
    config?.endpoints?.map((entry) => ({
      endpoint: normalizeEndpoint(entry.endpoint),
      user: entry.user,
      token: entry.token,
    })) ?? [];

  return {
    endpoint,
    user: config?.user,
    token: config?.token,
    endpoints,
  };
};

/**
 * Loads the user CLI config from disk, creating the default file on first use.
 *
 * @returns Resolved CLI config.
 */
export async function getConfig() {
  // copy default config
  let userConfig: CliUserConfig = structuredClone(defaultConfig);

  // create config folder if doesn't exist
  try {
    await stat(baseFolder);
  } catch {
    await mkdir(baseFolder, { recursive: true });
  }

  // create default user config if doesn't exist
  try {
    await stat(configPath);
  } catch {
    // write default config to file
    await writeFile(configPath, jsyaml.dump(userConfig), 'utf8');
    // return it
    return userConfig;
  }

  // load config from file
  try {
    const newCfg = jsyaml.load(await readFile(configPath, 'utf8')) as Partial<CliUserConfig> | null;
    userConfig = normalizeConfig(newCfg);
    return userConfig;
  } catch (e) {
    console.error('Error parsing user config:', e);
    throw e;
  }
}

/**
 * Persists a partial update to the current CLI config.
 *
 * @param newCfg - Config values to merge into the stored config.
 */
export async function updateConfig(newCfg: Partial<CliUserConfig>) {
  const currentConfig = await getConfig();
  const cfg = normalizeConfig(Object.assign(currentConfig, newCfg));
  await writeFile(configPath, jsyaml.dump(cfg), 'utf8');
}

/**
 * Checks whether the current config contains an authenticated user.
 *
 * @returns Whether the CLI currently has a logged-in user.
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
 * Removes the current user session from the CLI config.
 *
 * @returns Resolves when the stored session has been cleared.
 */
export async function logout() {
  const userConfig = await getConfig();
  delete userConfig.user;
  delete userConfig.token;
  await updateConfig(userConfig);
}
