import { join } from 'path';
import { getConfig, pluginsFolder, waitForConfig } from '../config/index.js';
import logger from '../logger/index.js';
import { runNPM } from '../util/index.js';

const loadedPlugins = [];

export function getPlugins() {
  return loadedPlugins;
}

export async function initPlugins() {
  // enable cors if needed
  await waitForConfig();
  const config = getConfig();

  // if no plugins added - just exit
  if (!config.plugins || !config.plugins.install || !config.plugins.install.length) {
    return;
  }

  // get list of plugins, install them and load into memory
  const pluginsList = config.plugins.install;
  for (const pluginName of pluginsList) {
    const log = await runNPM({ args: ['install', '--verbose', pluginName], cwd: pluginsFolder });
    logger.debug('Installed plugin:', pluginName);
    logger.debug('Install log:', log);
    const pluginPath = join(pluginsFolder, 'node_modules', pluginName);
    const plugin = require(pluginPath);
    loadedPlugins.push(plugin);
  }

  logger.debug('Done loading plugins: ', loadedPlugins);

  const exclusivePlugins = loadedPlugins.map((p) => p.config).filter((cfg) => cfg.exclusive);
  if (exclusivePlugins.length > 1) {
    logger.warn(`WARNING! You have installed ${exclusivePlugins.length} exclusive mode plugins!
This might cause unexpected behaviour during Exoframe deployemnts.
Please, only include one exclusive plugin at a time!`);
    logger.debug('Exclusive plugins list:', exclusivePlugins);
  }
}
