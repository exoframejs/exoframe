// our modules
import { getConfig } from '../config/index.js';
import logger from '../logger/index.js';
import docker from './docker.js';

const createDockerNetwork = async (networkName) => {
  const nets = await docker.listNetworks();
  let exoNet = nets.find((n) => n.Name === networkName);
  if (!exoNet) {
    logger.info(`Exoframe network ${networkName} does not exists, creating...`);
    exoNet = await docker.createNetwork({
      Name: networkName,
      Driver: 'bridge',
    });
  } else {
    exoNet = docker.getNetwork(exoNet.Id);
  }

  return exoNet;
};
const initDockerNetwork = async (config) => createDockerNetwork(config.exoframeNetwork);

// create exoframe network if needed
export const initNetwork = async () => {
  // get config
  const config = getConfig();
  return initDockerNetwork(config);
};

// create network function
export const createNetwork = async (networkName) => {
  return createDockerNetwork(networkName);
};
