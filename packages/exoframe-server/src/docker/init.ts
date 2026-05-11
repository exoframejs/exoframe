// our modules
import { waitForConfig } from '../config/index.ts';
import logger from '../logger/index.ts';
import { initNetwork } from './network.ts';
import { initTraefik } from './traefik.ts';

// export default function
export async function initDocker() {
  await waitForConfig();

  logger.info('Initializing docker services...');
  // create exoframe network if needed
  const exoNet = await initNetwork();

  // run traefik init
  await initTraefik(exoNet);
}
