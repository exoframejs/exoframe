/* eslint no-async-promise-executor: off */
import logger from '../logger/index.ts';
import docker from './docker.ts';

export async function removeContainer(containerInfo: { Id: string }) {
  const service = docker.getContainer(containerInfo.Id);
  try {
    await service.remove({ force: true });
  } catch (e) {
    const statusCode = typeof e === 'object' && e !== null && 'statusCode' in e ? e.statusCode : null;
    const message = typeof e === 'object' && e !== null && 'json' in e ? JSON.stringify(e.json) : '';
    // ignore not found errors and concurrent cleanup races
    if (statusCode === 404 || (statusCode === 409 && message.includes('already in progress'))) {
      return;
    }
    throw e;
  }
}

// asynchronously pulls docker image
// returns log after finished
export function pullImage(tag: string) {
  return new Promise<string>((resolve, reject) => {
    let log = '';
    docker.pull(tag, (err, stream) => {
      if (err) {
        logger.error('Error pulling:', err);
        reject(err);
        return;
      }
      stream.on('data', (d: Buffer | string) => {
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
  logger.debug(`Prune done: ${JSON.stringify(result)}`);
  return result;
}
