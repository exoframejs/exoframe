// our modules
import { waitForConfig } from '../config/index.js';
import logger from '../logger/index.js';
import { initNetwork } from './network.js';
import { initTraefik } from './traefik.js';

// export default function
export async function initDocker() {
  await waitForConfig();

  logger.info('Initializing docker services...');
  // create exoframe network if needed
  const exoNet = await initNetwork();

  // run traefik init
  await initTraefik(exoNet);
}
