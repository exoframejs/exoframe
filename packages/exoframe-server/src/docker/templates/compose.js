// npm packages
import { spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import jsyaml from 'js-yaml';
import _ from 'lodash';
import { join } from 'path';
import { v1 as uuidv1 } from 'uuid';
import { getEnv, getHost } from '../../util/index.js';

// generates new base name for deployment
const generateBaseName = ({ username, config }) =>
  `exo-${_.kebabCase(username)}-${_.kebabCase(config.name.split(':').shift())}`;

// maps array labels to objects, if necessary
const asObjectLabels = (labels) =>
  !Array.isArray(labels)
    ? labels
    : labels.reduce((acc, label) => {
        // Split at =, but only retain first value
        const [name, ...values] = label.split('=');
        const value = values.join('=');

        return { ...acc, [name]: value };
      }, {});

// function to update compose file with required vars
const updateCompose = ({ username, baseName, serverConfig, composePath }) => {
  const uid = uuidv1();

  // read compose file
  const compose = jsyaml.load(readFileSync(composePath, 'utf8'));

  // modify networks
  const network = serverConfig.exoframeNetwork;
  compose.networks = Object.assign(
    {},
    {
      [network]: {
        external: true,
      },
    },
    compose.networks
  );

  // modify services
  Object.keys(compose.services).forEach((svcKey) => {
    const name = `${baseName}-${svcKey}-${uid.split('-').shift()}`;
    const networks = Array.from(new Set([network, ...(compose.services[svcKey].networks || ['default'])]));
    // update basic settings
    const ext = {
      container_name: name,
      restart: 'on-failure:2',
    };
    compose.services[svcKey] = Object.assign({}, ext, compose.services[svcKey], { networks });

    // update labels if needed
    const extLabels = {
      'exoframe.name': name,
      'exoframe.deployment': name,
      'exoframe.user': username,
      'exoframe.project': baseName,
      'traefik.docker.network': network,
      'traefik.enable': 'true',
    };

    compose.services[svcKey].labels = Object.assign({}, extLabels, asObjectLabels(compose.services[svcKey].labels));
  });

  // write new compose back to file
  writeFileSync(composePath, jsyaml.dump(compose), 'utf8');

  return compose;
};

// function to execute docker-compose file and return the output
const executeCompose = ({ cmd, resultStream, tempDockerDir, folder, writeStatus, env = {} }) =>
  new Promise((resolve) => {
    const dc = spawn('docker-compose', cmd, { cwd: join(tempDockerDir, folder), env: { ...process.env, ...env } });
    const log = [];

    dc.stdout.on('data', (data) => {
      const message = data.toString().replace(/\n$/, '');
      const hasError = message.toLowerCase().includes('error');
      log.push(message);
      writeStatus(resultStream, { message, level: hasError ? 'error' : 'info' });
    });
    dc.stderr.on('data', (data) => {
      const message = data.toString().replace(/\n$/, '');
      const hasError = message.toLowerCase().includes('error');
      log.push(message);
      writeStatus(resultStream, { message, level: hasError ? 'error' : 'info' });
    });
    dc.on('exit', (code) => {
      writeStatus(resultStream, { message: `Docker-compose exited with code ${code.toString()}`, level: 'info' });
      resolve({ code: code.toString(), log });
    });
  });

// extract pre-built image names from build log
const logToImages = (log) =>
  log
    .filter((line) => line.startsWith('Successfully tagged'))
    .map((line) => line.replace(/^Successfully tagged /, '').trim());

export const name = 'docker-compose';

// function to check if the template fits this recipe
export async function checkTemplate({ tempDockerDir, folder }) {
  // compose file path
  const composePath = join(tempDockerDir, folder, 'docker-compose.yml');
  // if project already has docker-compose - just exit
  try {
    readFileSync(composePath);
    return true;
  } catch (e) {
    return false;
  }
}

// function to execute current template
export async function executeTemplate({
  username,
  config,
  serverConfig,
  tempDockerDir,
  folder,
  resultStream,
  docker,
  util,
}) {
  // compose file path
  const composePath = join(tempDockerDir, folder, 'docker-compose.yml');
  // if it does - run compose workflow
  util.logger.debug('Docker-compose file found, executing compose workflow..');
  util.writeStatus(resultStream, { message: 'Deploying docker-compose project..', level: 'info' });

  // generate basename
  const baseName = generateBaseName({ username, config });

  // update compose file with project params
  const composeConfig = updateCompose({ username, baseName, config, serverConfig, composePath, util, resultStream });
  // exit if update failed
  if (!composeConfig) {
    return;
  }
  util.logger.debug('Compose modified:', composeConfig);
  util.writeStatus(resultStream, { message: 'Compose file modified', data: composeConfig, level: 'verbose' });

  // generate host
  const host = getHost({ serverConfig, name: baseName, config });
  const env = getEnv({ username, config, name: baseName, host }).reduce(
    (merged, [key, value]) => ({ ...merged, [key]: value }),
    {}
  );

  // re-build images if needed
  const { code: buildExitCode, log: buildLog } = await executeCompose({
    cmd: ['--project-name', baseName, 'build', '--force-rm'],
    env,
    resultStream,
    tempDockerDir,
    folder,
    writeStatus: util.writeStatus,
  });
  util.logger.debug('Compose build executed, exit code:', buildExitCode);

  if (buildExitCode !== '0') {
    util.writeStatus(resultStream, {
      message: `Deployment failed! Docker-compose build exited with code: ${buildExitCode}.`,
      log: buildLog,
      level: 'error',
    });
    resultStream.end('');
    return;
  }

  // run compose via plugins if available
  const plugins = util.getPlugins();
  for (const plugin of plugins) {
    // only run plugins that have compose function
    if (!plugin.compose) {
      continue;
    }

    const images = logToImages(buildLog);
    const result = await plugin.compose({
      images,
      composeConfig,
      composePath,
      baseName,
      docker,
      util,
      serverConfig,
      resultStream,
      tempDockerDir,
      folder,
      yaml,
    });
    util.logger.debug('Running compose with plugin:', plugin.config.name, result);
    if (result && plugin.config.exclusive) {
      util.logger.debug('Compose finished via exclusive plugin:', plugin.config.name);
      return;
    }
  }

  // execute compose 'up -d'
  const { code: exitCode, log: execLog } = await executeCompose({
    cmd: ['--project-name', baseName, 'up', '-d'],
    env,
    resultStream,
    tempDockerDir,
    folder,
    writeStatus: util.writeStatus,
  });
  util.logger.debug('Compose up executed, exit code:', exitCode);

  if (exitCode !== '0') {
    util.writeStatus(resultStream, {
      message: `Deployment failed! Docker-compose up exited with code: ${exitCode}.`,
      log: execLog,
      level: 'error',
    });
    resultStream.end('');
    return;
  }

  // get container infos
  const allContainers = await docker.daemon.listContainers({ all: true });
  const deployments = await Promise.all(
    Object.keys(composeConfig.services)
      .map((svc) => composeConfig.services[svc].container_name)
      .map((name) => allContainers.find((c) => c.Names.find((n) => n === `/${name}`)))
      .map((info) => docker.daemon.getContainer(info.Id))
      .map((container) => container.inspect())
  );
  // return them
  util.writeStatus(resultStream, { message: 'Deployment success!', deployments, level: 'info' });
  resultStream.end('');
}
