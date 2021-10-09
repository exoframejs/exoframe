// our modules
import { getConfig } from '../config/index.js';
import { createNetwork, initNetwork } from '../docker/network.js';
import logger from '../logger/index.js';
import { getPlugins } from '../plugins/index.js';
import { getEnv, getHost, getProjectConfig, nameFromImage, projectFromConfig, writeStatus } from '../util/index.js';
import docker from './docker.js';

/**
 * Inspects given image and tries to determine exposed port
 */
const portFromImage = async (image) => {
  const img = await docker.getImage(image).inspect();
  const ports = Object.keys(img.Config.ExposedPorts);
  const firstPort = ports[0];
  const port = firstPort.split('/')[0];
  return port;
};

export async function startFromParams({
  image,
  deploymentName,
  projectName,
  username,
  backendName,
  frontend,
  port,
  hostname,
  restartPolicy,
  Env = [],
  additionalLabels = {},
  Mounts = [],
  additionalNetworks = [],
}) {
  const name = deploymentName || nameFromImage(image);

  // get server config
  const serverConfig = getConfig();

  // construct restart policy
  let RestartPolicy = {};
  const Name = ['no', 'on-failure', 'always'].find((c) => c.startsWith(restartPolicy));
  RestartPolicy = {
    Name,
  };
  if (restartPolicy.includes('on-failure')) {
    let restartCount = 2;
    try {
      restartCount = parseInt(restartPolicy.split(':')[1], 10);
    } catch (e) {
      // error parsing restart count, using default value
    }
    RestartPolicy.Name = 'on-failure';
    RestartPolicy.MaximumRetryCount = restartCount;
  }

  // update env with exoframe variables
  const exoEnv = [
    `EXOFRAME_DEPLOYMENT=${name}`,
    `EXOFRAME_USER=${username}`,
    `EXOFRAME_PROJECT=${projectName}`,
    `EXOFRAME_HOST=${frontend}`,
  ];
  Env = Env.concat(exoEnv);

  // construct backend name from host (if available) or name
  const Labels = Object.assign({}, additionalLabels, {
    'exoframe.deployment': name,
    'exoframe.user': username,
    'exoframe.project': projectName,
    'traefik.docker.network': serverConfig.exoframeNetwork,
    'traefik.enable': 'true',
  });

  // create middlewares array
  const middlewares = [];

  // if we have letsencrypt enabled - enable https redirect
  if (serverConfig.letsencrypt) {
    Labels[`traefik.http.middlewares.${name}-https.redirectscheme.scheme`] = 'https';
    Labels[`traefik.http.routers.${name}.tls.certresolver`] = 'exoframeChallenge';
    Labels[`traefik.http.routers.${name}.entrypoints`] = 'websecure';
    // redirect http to https
    Labels[`traefik.http.middlewares.${name}-redirect.redirectscheme.scheme`] = 'https';
    Labels[`traefik.http.routers.${name}-web.entrypoints`] = 'web';
    Labels[`traefik.http.routers.${name}-web.middlewares`] = `${name}-redirect@docker`;
    middlewares.push(`${name}-https@docker`);
  }

  // if we have compression on config - enable compression middleware
  if (serverConfig.compress) {
    Labels[`traefik.http.middlewares.${name}-compress.compress`] = 'true';
    middlewares.push(`${name}-compress@docker`);
  }

  // if host is set - add it to config
  if (frontend && frontend.length) {
    let usePort = port;
    // if user hasn't given port - detect it from image exposed ports
    if (!usePort) {
      usePort = await portFromImage(image).catch(() => 80);
      logger.debug('Detected deployment port:', usePort);
    }
    Labels[`traefik.http.services.${projectName}.loadbalancer.server.port`] = String(port);
    Labels[`traefik.http.routers.${name}.rule`] = frontend;
    Labels[`traefik.http.routers.${name}-web.rule`] = frontend;
  }

  // remove or stringify all middlewares
  if (middlewares.length > 0) {
    Labels[`traefik.http.routers.${name}.middlewares`] = middlewares.join(',');
  }

  // run startFromParams via plugins if available
  const plugins = getPlugins();
  logger.debug('Got plugins, running startFromParams:', plugins);
  for (const plugin of plugins) {
    // only run plugins that have startFromParams function
    if (!plugin.startFromParams) {
      continue;
    }

    const result = await plugin.startFromParams({
      docker,
      serverConfig,
      name,
      image,
      deploymentName,
      projectName,
      username,
      backendName,
      frontend,
      port,
      hostname,
      restartPolicy,
      serviceLabels: Labels,
      Env,
      Mounts,
      additionalNetworks,
    });
    logger.debug('Executed startWithParams with plugin:', plugin.config.name, result);
    if (result && plugin.config.exclusive) {
      logger.debug('StartWithParams finished via exclusive plugin:', plugin.config.name);
      return result;
    }
  }

  // create config
  const containerConfig = {
    Image: image,
    name,
    Env,
    Labels,
    HostConfig: {
      RestartPolicy,
      Mounts,
    },
  };

  if (hostname && hostname.length) {
    containerConfig.NetworkingConfig = {
      EndpointsConfig: {
        exoframe: {
          Aliases: [hostname],
        },
      },
    };
  }

  // create container
  const container = await docker.createContainer(containerConfig);

  // connect container to exoframe network
  const exoNet = await initNetwork();
  await exoNet.connect({
    Container: container.id,
  });

  // connect to additional networks if any
  await Promise.all(
    additionalNetworks.map(async (netName) => {
      const net = await createNetwork(netName);
      await net.connect({ Container: container.id });
    })
  );

  // start container
  await container.start();

  const containerInfo = await container.inspect();
  const containerData = docker.getContainer(containerInfo.Id);
  return containerData.inspect();
}

export async function start({ image, username, folder, resultStream, existing = [] }) {
  const name = nameFromImage(image);

  // get server config
  const serverConfig = getConfig();

  // get project info
  const config = getProjectConfig(folder);

  // generate project name
  const project = projectFromConfig({ username, config });

  // generate host
  const host = getHost({ serverConfig, name, config });

  // generate env vars
  const Env = getEnv({ username, config, name, project, host }).map((pair) => pair.join('='));

  // construct restart policy
  let RestartPolicy = {};
  const restartPolicy = config.restart || 'on-failure:2';
  const Name = ['no', 'on-failure', 'always'].find((c) => c.startsWith(restartPolicy));
  RestartPolicy = {
    Name,
  };
  if (restartPolicy.includes('on-failure')) {
    let restartCount = 2;
    try {
      restartCount = parseInt(restartPolicy.split(':')[1], 10);
    } catch (e) {
      // error parsing restart count, using default value
    }
    RestartPolicy.Name = 'on-failure';
    RestartPolicy.MaximumRetryCount = restartCount;
  }
  const additionalLabels = config.labels || {};

  const configMiddlewares = Object.keys(additionalLabels)
    // we want all middlewares
    .filter((label) => label.startsWith('traefik.http.middlewares.'))
    // map them to name with @docker postfix
    .map((label) => {
      const [middlewareName] = label.replace('traefik.http.middlewares.', '').split('.');
      return `${middlewareName}@docker`;
    })
    // concat with other middlewares from config if present
    .concat(config.middlewares || []);

  const Labels = Object.assign({}, additionalLabels, {
    'exoframe.deployment': name,
    'exoframe.user': username,
    'exoframe.project': project,
    'traefik.docker.network': serverConfig.exoframeNetwork,
    'traefik.enable': 'true',
  });

  // create middlewares array
  const middlewares = configMiddlewares || [];

  // if we have letsencrypt enabled - enable https redirect
  if (serverConfig.letsencrypt && (config.letsencrypt || config.letsencrypt === undefined)) {
    Labels[`traefik.http.middlewares.${name}-https.redirectscheme.scheme`] = 'https';
    Labels[`traefik.http.routers.${name}.tls.certresolver`] = 'exoframeChallenge';
    Labels[`traefik.http.routers.${name}.entrypoints`] = 'websecure';
    // redirect http to https
    Labels[`traefik.http.middlewares.${name}-redirect.redirectscheme.scheme`] = 'https';
    Labels[`traefik.http.routers.${name}-web.entrypoints`] = 'web';
    Labels[`traefik.http.routers.${name}-web.middlewares`] = `${name}-redirect@docker`;
    middlewares.push(`${name}-https@docker`);
  }

  // if we have compression on config - enable compression middleware
  if (config.compress || (config.compress === undefined && serverConfig.compress)) {
    Labels[`traefik.http.middlewares.${name}-compress.compress`] = 'true';
    middlewares.push(`${name}-compress@docker`);
  }

  // if host is set - add it to config
  if (host && host.length) {
    let { port } = config;
    // if user hasn't given port - detect it from image exposed ports
    if (!port) {
      // try to detect port and default to 80 if failed
      port = await portFromImage(image).catch(() => 80);
      logger.debug('Detected deployment port:', port);
    }
    Labels[`traefik.http.services.${project}.loadbalancer.server.port`] = String(port);
    const rule = host.includes('Host(') ? host : `Host(\`${host}\`)`;
    Labels[`traefik.http.routers.${name}.rule`] = rule;
    Labels[`traefik.http.routers.${name}-web.rule`] = rule;
  }

  // if rate-limit is set - add it to config
  if (config.rateLimit) {
    // set values from project config
    Labels[`traefik.http.middlewares.${name}-rate.ratelimit.average`] = String(config.rateLimit.average);
    Labels[`traefik.http.middlewares.${name}-rate.ratelimit.burst`] = String(config.rateLimit.burst);
    middlewares.push(`${name}-rate@docker`);
  }

  // if basic auth is set - add it to config
  if (config.basicAuth && config.basicAuth.length) {
    Labels[`traefik.http.middlewares.${name}-auth.basicauth.users`] = config.basicAuth;
    middlewares.push(`${name}-auth@docker`);
  }

  // remove or stringify all middlewares
  if (middlewares.length > 0) {
    Labels[`traefik.http.routers.${name}.middlewares`] = [...new Set(middlewares)].join(',');
  }

  // run startFromParams via plugins if available
  const plugins = getPlugins();
  logger.debug('Got plugins, running start:', plugins);
  for (const plugin of plugins) {
    // only run plugins that have startFromParams function
    if (!plugin.start) {
      continue;
    }

    const result = await plugin.start({
      config,
      serverConfig,
      project,
      username,
      name,
      image,
      Env,
      serviceLabels: Labels,
      writeStatus,
      resultStream,
      docker,
    });
    logger.debug('Executed start with plugin:', plugin.config.name, result);
    if (result && plugin.config.exclusive) {
      logger.debug('Start finished via exclusive plugin:', plugin.config.name);
      return result;
    }
  }

  // create config
  const containerConfig = {
    Image: image,
    name,
    Env,
    Labels,
    HostConfig: {
      RestartPolicy,
    },
  };

  // if volumes are set - add them to config
  if (config.volumes && config.volumes.length) {
    const mounts = config.volumes
      .map((vol) => vol.split(':'))
      .map(([src, dest]) => ({
        Type: 'volume',
        Source: src,
        Target: dest,
      }));
    containerConfig.HostConfig.Mounts = mounts;
  }

  if (config.hostname && config.hostname.length) {
    containerConfig.NetworkingConfig = {
      EndpointsConfig: {
        exoframe: {
          Aliases: [config.hostname],
        },
      },
    };
  }

  writeStatus(resultStream, {
    message: 'Starting container with following config:',
    containerConfig,
    level: 'verbose',
  });

  // create container
  const container = await docker.createContainer(containerConfig);

  // connect container to exoframe network
  const exoNet = await initNetwork();
  await exoNet.connect({
    Container: container.id,
  });

  // start container
  await container.start();

  writeStatus(resultStream, { message: 'Container successfully started!', level: 'verbose' });

  const containerInfo = await container.inspect();
  const containerData = docker.getContainer(containerInfo.Id);
  return containerData.inspect();
}
