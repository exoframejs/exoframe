/* eslint no-async-promise-executor: off */
import { join } from 'path';
import { pack } from 'tar-fs';
import { tempDockerDir } from '../config/paths.js';
import logger from '../logger/index.js';
import { getBuildargs, getProjectConfig, tagFromConfig, writeStatus } from '../util/index.js';
import docker from './docker.js';

const noop = () => {};

export function buildFromParams({ tarStream, tag, buildargs, logLine = noop }) {
  return new Promise(async (resolve, reject) => {
    // deploy as docker
    const log = [];
    // track errors
    let hasErrors = false;
    // send build command
    const output = await docker.buildImage(tarStream, { buildargs, t: tag, pull: true });
    output.on('data', (d) => {
      const str = d.toString();
      const parts = str.split('\n');
      parts
        .filter((s) => s.length > 0)
        .forEach((s) => {
          try {
            const data = JSON.parse(s);
            // process log data
            if (data.stream && data.stream.length) {
              log.push(data.stream);
              logLine({ message: data.stream, level: 'verbose' });
            } else if (data.error && data.error.length) {
              // process error data
              log.push(data.error);
              logLine({ message: data.error, level: 'error' });
              hasErrors = true;
            } else {
              // push everything else as-is
              log.push(s);
              logLine({ message: s, level: 'verbose' });
            }
          } catch {
            if (s && s.length) {
              log.push(s);
              logLine({ message: s, level: 'verbose' });
            }
          }
        });
    });
    output.on('end', () => {
      if (hasErrors) {
        reject({ error: 'Build failed! See build log for details.', log, image: tag });
        return;
      }
      resolve({ log, image: tag });
    });
  });
}

export async function build({ username, folder, resultStream }) {
  // get packed stream
  const tarStream = pack(join(tempDockerDir, folder));

  // get project info
  const config = getProjectConfig(folder);

  // construct image tag
  const tag = tagFromConfig({ username, config });
  logger.debug('building with tag:', tag);
  writeStatus(resultStream, { message: `Building image with tag: ${tag}`, level: 'verbose' });

  // construct build args
  const buildargs = getBuildargs({ username, config });
  if (buildargs) {
    logger.debug('building with args:', buildargs);
    writeStatus(resultStream, {
      message: `Building image with buildargs: ${Object.keys(buildargs).join(', ')}`,
      level: 'verbose',
    });
  }

  // create logger function
  const logLine = (data) => writeStatus(resultStream, data);

  // return build
  return buildFromParams({ tarStream, tag, buildargs, logLine });
}
