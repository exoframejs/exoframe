import { existsSync, readFileSync, statSync, writeFileSync } from 'fs';
import jsyaml from 'js-yaml';
import { mkdirp } from 'mkdirp';
import { join } from 'path';
import { baseFolder, getConfig, waitForConfig } from '../config/index.js';
import logger from '../logger/index.js';
import docker from './docker.js';
import { pullImage } from './util.js';

function getTraefikPath(volumePath) {
  return join(volumePath, 'traefik');
}

function getInternalTraefikPath(volumePath) {
  return join(volumePath, '.internal', 'traefik');
}

async function generateTraefikConfig(config, volumePath) {
  // letsencrypt flags
  const letsencrypt = {
    entryPoints: { web: { address: ':80' }, websecure: { address: ':443' } },
    certificatesResolvers: {
      exoframeChallenge: {
        acme: {
          httpChallenge: { entryPoint: 'web' },
          email: config.letsencryptEmail || null,
          storage: '/var/traefik/acme.json',
        },
      },
    },
  };

  let traefikConfig = {
    log: { level: config.debug ? 'DEBUG' : 'warning', filePath: '/var/traefik/traefik.log' },
    entryPoints: { web: { address: ':80' } },
    providers: {
      docker: {
        network: 'exoframe',
        endpoint: 'unix:///var/run/docker.sock',
        exposedByDefault: false,
      },
    },
    ...(config.letsencrypt ? letsencrypt : {}),
  };

  // load user definend config
  const traefikCustomConfigPath = join(getTraefikPath(volumePath), 'traefik.yml');
  if (existsSync(traefikCustomConfigPath)) {
    logger.info('Using custom traefik config:', traefikCustomConfigPath);

    const traefikCustomConfig = jsyaml.load(readFileSync(traefikCustomConfigPath, 'utf8'));

    // merge custom
    traefikConfig = { ...traefikConfig, ...traefikCustomConfig };
  }

  // create internal traefik config folder
  try {
    statSync(getInternalTraefikPath(volumePath));
  } catch {
    await mkdirp(getInternalTraefikPath(volumePath));
  }

  // write new generated traefik config
  const generatedTraefikConfigPath = join(getInternalTraefikPath(volumePath), 'traefik.yml');
  writeFileSync(generatedTraefikConfigPath, jsyaml.dump(traefikConfig));
}

// export traefik init function
export async function initTraefik(exoNet) {
  await waitForConfig();

  logger.info('Initializing traefik ...');
  // get config
  const config = getConfig();

  // check if traefik management is disabled
  if (!config.traefikImage) {
    logger.info('Traefik managment disabled, skipping init.');
    return;
  }

  // build local traefik path
  let volumePath = baseFolder;
  let initLocal = true;

  // get all containers
  const allContainers = await docker.listContainers({ all: true });
  // find server container
  const server = allContainers.find((c) => c.Names.find((n) => n.startsWith('/exoframe-server')));
  // if server was found - extract traefik path from it
  if (server) {
    const configVol = (server.Mounts || []).find((v) => v.Destination === '/root/.config/exoframe');
    if (configVol) {
      volumePath = configVol.Source;
      logger.info('Server is running inside docker.');
      initLocal = false;
    }
  }

  // if server volume wasn't found - create local folder if needed
  if (initLocal) {
    try {
      statSync(volumePath);
    } catch {
      await mkdirp(volumePath);
    }
    logger.info('Server is running without docker.');
  }

  // try to find traefik instance
  const traefik = allContainers.find((c) => c.Names.find((n) => n.startsWith(`/${config.traefikName}`)));

  // generate traefik config
  if (!config.traefikDisableGeneratedConfig) {
    await generateTraefikConfig(config, baseFolder);
  }

  // if traefik exists and running - restart it to reload config
  if (traefik && !traefik.Status.includes('Exited')) {
    logger.info('Traefik already running. Restarting traefik ...');
    const traefikContainer = docker.getContainer(traefik.Id);
    await traefikContainer.restart();
    logger.info('Docker init done!');
    return;
  }

  // if container is exited - remove and recreate
  if (traefik && traefik.Status.startsWith('Exited')) {
    logger.info('Exited traefik instance found, re-creating ...');
    const traefikContainer = docker.getContainer(traefik.Id);
    // remove
    await traefikContainer.remove();
  }

  // pull image if needed
  const allImages = await docker.listImages();
  const traefikImage = allImages.find((img) => img.RepoTags && img.RepoTags.includes(config.traefikImage));
  if (!traefikImage) {
    logger.info('No traefik image found, pulling ...');
    const pullLog = await pullImage(config.traefikImage);
    logger.debug(pullLog);
  }

  // start traefik in docker
  const container = await docker.createContainer({
    Image: config.traefikImage,
    name: config.traefikName,
    Cmd: ['--configFile=/var/traefik-config/traefik.yml'],
    Labels: {
      'exoframe.deployment': 'exo-traefik',
      'exoframe.user': 'admin',
      ...(config.traefikLabels || {}), // custom traefik labels
    },
    ExposedPorts: { '80/tcp': {}, '443/tcp': {} },
    HostConfig: {
      RestartPolicy: { Name: 'on-failure', MaximumRetryCount: 2 },
      Binds: [
        '/var/run/docker.sock:/var/run/docker.sock', // docker socket
        `${getInternalTraefikPath(volumePath)}:/var/traefik-config`, // mount generated config
        `${getTraefikPath(volumePath)}:/var/traefik`, // mount folder for traefik.log, acme.json
      ],
      PortBindings: { '80/tcp': [{ HostPort: '80' }], '443/tcp': [{ HostPort: '443' }] },
    },
  });

  // connect traefik to exoframe net
  await exoNet.connect({ Container: container.id });

  // start container
  await container.start();
  logger.info('Traefik instance started ...');
}
