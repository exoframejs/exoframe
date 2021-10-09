// our modules
import { getConfig, waitForConfig } from '../config/index.js';
import logger from '../logger/index.js';
import { getPlugins } from '../plugins/index.js';
import docker from './docker.js';
import { initNetwork } from './network.js';
import { initTraefik } from './traefik.js';

// export default function
export async function initDocker() {
  await waitForConfig();

  logger.info('Initializing docker services...');
  // create exoframe network if needed
  const exoNet = await initNetwork();

  // get config
  const config = getConfig();

  // run init via plugins if available
  const plugins = getPlugins();
  logger.debug('Got plugins, running init:', plugins);
  for (const plugin of plugins) {
    // only run plugins that have init function
    if (!plugin.init) {
      continue;
    }

    const result = await plugin.init({ config, logger, docker });
    logger.debug('Initing traefik with plugin:', plugin.config.name, result);
    if (result && plugin.config.exclusive) {
      logger.info('Init finished via exclusive plugin:', plugin.config.name);
      return;
    }
  }

  // run traefik init
  await initTraefik(exoNet);
}
