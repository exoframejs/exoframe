/* eslint no-async-promise-executor: off */
import logger from '../logger/index.js';
import docker from './docker.js';

export async function removeContainer(containerInfo) {
  const service = docker.getContainer(containerInfo.Id);
  try {
    await service.remove({ force: true });
  } catch (e) {
    // ignore not found errors
    if (e.statusCode === 404) {
      return;
    }
    throw e;
  }
}

// asynchronously pulls docker image
// returns log after finished
export function pullImage(tag) {
  return new Promise(async (resolve, reject) => {
    let log = '';
    docker.pull(tag, (err, stream) => {
      if (err) {
        logger.error('Error pulling:', err);
        reject(err);
        return;
      }
      stream.on('data', (d) => {
        const line = d.toString();
        log += line;
      });
      stream.once('end', () => resolve(log));
    });
  });
}

// prunes builder cache, unused images and volumes
export async function pruneDocker() {
  // TODO: re-enable pruneBuilder once fixed in dockerode
  // await docker.pruneBuilder();
  logger.debug('Running prune..');
  const result = await Promise.all([docker.pruneImages(), docker.pruneVolumes()]);
  logger.debug('Prune done:', result);
  return result;
}
