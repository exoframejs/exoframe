import fs from 'fs';
import got from 'got';
import _ from 'highland';
import multimatch from 'multimatch';
import path from 'path';
import { serializeError } from 'serialize-error';
import tar from 'tar-fs';
import { formatServices } from './utils/formatServices';

/**
 * @typedef {object} DeployParams
 * @property {string} folder - folder to deploy
 * @property {string} endpoint - exoframe endpoint to use for deployment
 * @property {string} [token] - auth token to use for deployment
 * @property {boolean} [update] - whether to execute deployment as update
 * @property {string} [configFile] - override for deployment config file
 * @property {number} [verbose] - level of verbosity
 */

/**
 * @typedef {object} StreamToResponseParams
 * @property {object} tarStream - tar stream for current deployment
 * @property {string} remoteUrl - remote URL
 * @property {object} [options] - options
 * @property {number} [verbose] - verbosity level
 * @property {function} [log] - log function
 */

/**
 * @typedef {object} ResponseData
 * @property {string} level - level
 * @property {ServiceSpec[]} deployments - list of deployments
 * @property {string} message - message
 * @property {string} [error] - error
 * @property {any[]} log - log array
 */

/**
 * @typedef {object} DeployResult
 * @property {FormattedService[]} formattedServices - formatted services
 * @property {any[]} log - log array
 */

const defaultIgnores = ['.git', 'node_modules', '.exoframeignore'];

/**
 * Converts stream to response
 * @param {StreamToResponseParams} streamParams
 * @returns {Promise<ResponseData>}
 */
const streamToResponse = ({ tarStream, remoteUrl, options, verbose = 0, log = () => {} }) =>
  new Promise((resolve, reject) => {
    // store error and result
    let error;
    let result;
    // pipe stream to remote
    const stream = _(tarStream.pipe(got.stream.post(remoteUrl, options)))
      .split()
      .filter((l) => l?.length > 0);
    // store output
    stream.on('data', (str) => {
      const s = str.toString();
      try {
        const data = JSON.parse(s);
        // always log info
        if (data.level === 'info') {
          verbose && log('[info]', data.message);
          // if data has deployments info - assign it as result
          if (data.deployments) {
            result = data;
          }
        }
        // log verbose if needed
        data.level === 'verbose' && verbose > 1 && log('[verbose]', data.message);
        // if error - store as error and log
        if (data.level === 'error') {
          verbose && log('[error]', data.message);
          verbose > 1 && log(JSON.stringify(data, null, 2));
          error = new Error(data.message);
          error.response = data;
        }
      } catch (e) {
        error = new Error('Error parsing output!');
        error.response = {
          error: s,
        };
        verbose && log('[error]', 'Error parsing line:', s);
      }
    });
    // listen for read stream end
    stream.on('end', () => {
      // if stream had error - reject
      if (error !== undefined) {
        reject(error);
        return;
      }
      // otherwise resolve
      resolve(result);
    });
    stream.on('error', (e) => (error = e));
  });

/**
 * Deploys given project
 * @param {DeployParams} params
 * @returns {Promise<DeployResult>}
 */
export const deploy = async ({ folder, endpoint, token, update, configFile = 'exoframe.json', verbose = 0 }) => {
  const loglist = [];
  const log = (...args) => {
    loglist.push(args);
  };

  // exit if not logged in and no token provided
  if (!token) {
    throw new Error('No deployment token provided!');
  }

  // create config vars
  const workdir = folder ? path.join(process.cwd(), folder) : process.cwd();
  const folderName = path.basename(workdir);
  const remoteUrl = `${endpoint}/${update ? 'update' : 'deploy'}`;

  // make sure workdir exists
  if (!fs.existsSync(workdir)) {
    throw new Error(`Path do not exists`);
  }

  // create config if doesn't exist
  const configPath = path.join(workdir, configFile);
  try {
    fs.statSync(configPath);
  } catch (e) {
    const defaultConfig = JSON.stringify({ name: folderName });
    fs.writeFileSync(configPath, defaultConfig, 'utf-8');
    // if in verbose mode - log config creation
    verbose && log('Create new default config:', defaultConfig);
  }

  // syntax-check & validate config
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath).toString());
  } catch (e) {
    throw new Error(`Your exoframe.json is not valid: ${JSON.stringify(serializeError(e), null, 2)}`);
  }

  // validate project name
  if (!config.name || !config.name.length) {
    throw new Error('Project should have a valid name in config!');
  }

  // try read ingore file
  const ignorePath = path.join(workdir, '.exoframeignore');
  let ignores = defaultIgnores;
  try {
    ignores = fs
      .readFileSync(ignorePath)
      .toString()
      .split('\n')
      .filter((line) => line && line.length > 0)
      .concat(['.exoframeignore']);
  } catch (e) {
    verbose && log('\nNo .exoframeignore file found, using default ignores');
  }

  // ignore exoframe.json if user supplied custom config
  if (configFile && configFile !== 'exoframe.json') {
    ignores.push('exoframe.json');
  }

  // create tar stream from current folder
  const tarStream = tar.pack(workdir, {
    // ignore files from ignore list
    ignore: (name) => {
      const relativePath = path.relative(workdir, name);
      const result = multimatch([relativePath], ignores).length !== 0;
      return result;
    },
    // map custom config to exoframe.json when provided
    map: (headers) => {
      // if working with custom config - change its name before packing
      if (configFile && headers.name === configFile) {
        return {
          ...headers,
          name: 'exoframe.json',
        };
      }

      return headers;
    },
  });
  // if in verbose mode - log ignores
  verbose && log('\nIgnoring following paths:', ignores);

  // create request options
  const options = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
    },
  };

  // pipe stream to remote
  const res = await streamToResponse({ tarStream, remoteUrl, options, verbose });
  // check deployments
  if (!res?.deployments || !res?.deployments.length) {
    const err = new Error('Something went wrong!');
    err.response = res;
    throw err;
  }

  // log response in verbose-verbose mode
  verbose > 2 && log('Server response:', JSON.stringify(res, null, 2), '\n');

  // process deployments
  const formattedServices = formatServices(res.deployments);
  return { formattedServices, log: loglist };
};
