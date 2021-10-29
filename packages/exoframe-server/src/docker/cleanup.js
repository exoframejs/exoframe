import { getConfig } from '../config/index.js';
import { compareNames, sleep } from '../util/index.js';
import docker from './docker.js';
import { pruneDocker, removeContainer } from './util.js';

// time to wait before removing old projects on update
const WAIT_TIME = process.env.NODE_ENV === 'testing' ? 0 : 5000;

// schedule docker prune for next tick (if enabled in config)
export const schedulePrune = () => {
  // get server config
  const serverConfig = getConfig();
  if (serverConfig.autoprune) {
    process.nextTick(pruneDocker);
  }
};

export const scheduleCleanup = ({ username, project, existing }) => {
  process.nextTick(async () => {
    // wait a bit for it to start
    await sleep(WAIT_TIME);

    // get all current containers
    const containers = await docker.listContainers();
    // find containers for current user and project
    const running = containers.filter(
      (c) => c.Labels['exoframe.user'] === username && c.Labels['exoframe.project'] === project
    );

    // filter out old container that don't have new containers
    // that are already up and running
    const toRemove = existing.filter((container) => {
      const newInstance = running.find((runningContainer) =>
        compareNames(container.Labels['exoframe.name'], runningContainer.Labels['exoframe.name'])
      );
      return newInstance && newInstance.State === 'running' && newInstance.Status.toLowerCase().includes('up');
    });

    // remove old containers
    await Promise.all(toRemove.map(removeContainer));

    // if not done - schedule with remaining containers
    if (toRemove.length !== existing.length) {
      const notRemoved = existing.filter((c) => !toRemove.find((rc) => rc.Id === c.Id));
      scheduleCleanup({ username, project, existing: notRemoved });
    }

    // run prune on next tick if enabled in config
    schedulePrune();
  });
};
