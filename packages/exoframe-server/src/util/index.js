import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import _ from 'lodash';
import { join } from 'path';
import { rimraf } from 'rimraf';
import { extract } from 'tar-fs';
import { tempDockerDir } from '../config/index.js';
import { getSecretsCollection } from '../db/secrets.js';

// try to find secret with current value name and return secret value if present
const valueOrSecret = (value, secrets) => {
  const secret = secrets.find((s) => `@${s.name}` === value);
  if (secret) {
    return secret.value;
  }
  return value;
};

// cleanup temp folder
export async function cleanTemp(folder) {
  return rimraf(join(tempDockerDir, folder));
}

// unpack function for incoming project files
export function unpack({ tarStream, folder }) {
  return new Promise((resolve, reject) => {
    // create whatever writestream you want
    const s = tarStream.pipe(extract(join(tempDockerDir, folder)));
    s.on('finish', () => resolve());
    s.on('error', (e) => reject(e));
  });
}

export function getProjectConfig(folder) {
  const projectConfigString = readFileSync(join(tempDockerDir, folder, 'exoframe.json'));
  const config = JSON.parse(projectConfigString);

  return config;
}

export function tagFromConfig({ username, config }) {
  return `exo-${_.kebabCase(username)}-${_.kebabCase(config.name)}:latest`;
}

export function baseNameFromImage(image) {
  return image
    .split(':')
    .shift()
    .replace(/[^a-zA-Z0-9_-]/g, '');
}

export function nameFromImage(image) {
  const baseName = baseNameFromImage(image);
  const uid = randomUUID();
  return `${baseName}-${uid.split('-').shift()}`;
}

export function projectFromConfig({ username, config }) {
  const image = tagFromConfig({ username, config });
  const baseName = baseNameFromImage(image);
  return config.project || baseName;
}

export function sleep(time) {
  return new Promise((r) => setTimeout(r, time));
}

export function writeStatus(stream, data) {
  return stream.write(`${JSON.stringify(data)}\n`);
}

export function runNPM({ args, cwd }) {
  return new Promise((resolve) => {
    const npm = spawn('npm', args, { cwd });
    const log = [];
    npm.stdout.on('data', (data) => {
      const message = data.toString().replace(/\n$/, '');
      const hasError = message.toLowerCase().includes('error');
      log.push({ message, level: hasError ? 'error' : 'info' });
    });
    npm.stderr.on('data', (data) => {
      const message = data.toString().replace(/\n$/, '');
      const hasError = message.toLowerCase().includes('error');
      log.push({ message, level: hasError ? 'error' : 'info' });
    });
    npm.on('exit', (code) => {
      log.push({ message: `npm exited with code ${code.toString()}`, level: 'info' });
      resolve(log);
    });
  });
}

export function compareNames(nameOne = '', nameTwo = '') {
  const nameOneParts = nameOne.split('-');
  const nameOneClean = nameOneParts.slice(0, nameOneParts.length - 2).join('-');

  const nameTwoParts = nameTwo.split('-');
  const nameTwoClean = nameTwoParts.slice(0, nameTwoParts.length - 2).join('-');
  return nameOneClean === nameTwoClean;
}

export function getHost({ serverConfig, name, config }) {
  // construct base domain from config, prepend with "." if it's not there
  const baseDomain = serverConfig.baseDomain ? serverConfig.baseDomain.replace(/^(\.?)/, '.') : undefined;
  // construct default domain using given base domain
  const defaultDomain = baseDomain ? `${name}${baseDomain}` : undefined;
  // construct host
  const host = config.domain === undefined ? defaultDomain : config.domain;
  return host;
}

export function getEnv({ username, config, name, host, project = config.project || name }) {
  // replace env vars values with secrets if needed
  const secrets = getSecretsCollection().find({ user: username });
  // generate env vars (with secrets)
  const userEnv = config.env
    ? Object.entries(config.env).map(([key, value]) => [key, valueOrSecret(value, secrets)])
    : [];
  return [
    ...userEnv,
    ['EXOFRAME_DEPLOYMENT', name],
    ['EXOFRAME_USER', username],
    ['EXOFRAME_PROJECT', project],
    ['EXOFRAME_HOST', host],
  ];
}

export function getBuildargs({ username, config }) {
  // replace env vars values with secrets if needed
  const secrets = getSecretsCollection().find({ user: username });
  // generate env vars (with secrets)
  const buildArgs = config.buildargs
    ? Object.entries(config.buildargs).map(([key, value]) => [key, valueOrSecret(value, secrets)])
    : [];
  if (buildArgs.length > 0) {
    return Object.fromEntries(buildArgs);
  }
  return undefined;
}

export function functionToContainerFormat({ config, route, type = 'http' }) {
  return {
    Name: `/${config.name}`,
    Config: {
      Labels: {
        [`traefik.http.routers.${config.name}.rule`]: type === 'http' ? route || `/${config.name}` : 'Non-HTTP',
        'exoframe.project': config.name,
        'exoframe.type': `Function (${type})`,
      },
    },
    NetworkSettings: {
      Networks: {},
    },
    State: {
      Status: 'running',
    },
  };
}
