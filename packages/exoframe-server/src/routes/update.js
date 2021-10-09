import { getConfig } from '../config/index.js';
import docker from '../docker/docker.js';
import { initDocker } from '../docker/init.js';
import { initNetwork } from '../docker/network.js';
import { pullImage } from '../docker/util.js';
import logger from '../logger/index.js';
import { sleep } from '../util/index.js';

// image names
const serverImageNameStable = 'exoframe/server:latest';
const serverImageNameNightly = 'exoframe/server:develop';

export default (fastify) => {
  fastify.route({
    method: 'POST',
    path: '/update/:target',
    async handler(request, reply) {
      // get username
      const { target } = request.params;

      // get traefik image name
      const config = getConfig();
      const { traefikName, traefikImage } = config;

      // traefik update logic
      if (target === 'traefik') {
        if (!traefikImage) {
          reply
            .code(500)
            .send({ updated: false, error: 'Cannot updating traefik', log: ['Traefik management is disabled!'] });
          return;
        }

        // get all containers
        const allContainers = await docker.listContainers();
        // try to find traefik instance
        const oldTraefik = allContainers.find(
          (c) => c.Image === traefikImage && c.Names.find((n) => n === `/${traefikName}`)
        );

        const pullLog = await pullImage(traefikImage);
        // check if already up to date
        if (pullLog.includes('Image is up to date')) {
          logger.debug('Traefik is already up to date!');
          reply.code(200).send({ updated: false });
          return;
        }
        // check if new image was pulled
        if (pullLog.includes('Downloaded newer image')) {
          logger.debug('Traefik image updated, restarting service..');
          // kill old traefik if needed
          if (oldTraefik && oldTraefik.Id) {
            const traefikContainer = docker.getContainer(oldTraefik.Id);
            await traefikContainer.stop();
            await traefikContainer.remove();
          }
          // re-init traefik
          initDocker();
          // reply
          reply.code(200).send({ updated: true });
          return;
        }

        // otherwise report error with current log
        reply.code(500).send({ updated: false, error: 'Error updating image', log: pullLog });
        return;
      }

      // self update logic
      if (target === 'server') {
        // get all containers
        const allContainers = await docker.listContainers();
        // try to find traefik instance
        const oldServer = allContainers.find((c) => c.Names.find((n) => n.startsWith('/exoframe-server')));

        // determine server image name based on user config
        const serverImageName = config.updateChannel === 'stable' ? serverImageNameStable : serverImageNameNightly;
        const pullLog = await pullImage(serverImageName);
        // check if already up to date
        if (pullLog.includes('Image is up to date')) {
          logger.debug('Exoframe server is already up to date!');
          reply.code(200).send({ updated: false });
          return;
        }
        // check if new image was pulled
        if (pullLog.includes('Downloaded newer image')) {
          logger.debug('Exoframe server image updated, restarting service..');
          // get old server info
          const serverContainer = docker.getContainer(oldServer.Id);
          const oldServerInfo = await serverContainer.inspect();
          // get image and its hash
          const allImages = await docker.listImages();
          const serverImage = allImages.find((img) => img.RepoTags && img.RepoTags.includes(serverImageName));
          const hash = serverImage.Id.split(':').pop().substr(0, 12);
          // init config
          const dockerConfig = {
            Image: serverImageName,
            name: `exoframe-server-${hash}`,
            Env: oldServerInfo.Config.Env,
            Labels: oldServerInfo.Config.Labels,
            HostConfig: {
              Binds: oldServerInfo.HostConfig.Binds,
              RestartPolicy: oldServerInfo.HostConfig.RestartPolicy,
            },
          };
          // start new self
          const container = await docker.createContainer(dockerConfig);
          // get exoframe network
          const exoNet = await initNetwork();
          // connect traefik to exoframe net
          await exoNet.connect({
            Container: container.id,
          });
          // start container
          await container.start();
          // reply
          reply.code(200).send({ updated: true });
          // sleep for a second to let reply finish
          await sleep(1000);
          // kill old self on next tick
          process.nextTick(() => serverContainer.remove({ force: true }));
          return;
        }

        // otherwise report error with current log
        reply.code(500).send({ updated: false, error: 'Error updating image', log: pullLog });
        return;
      }

      // default reply
      reply.code(204).send({ updated: false, error: 'Wat' });
    },
  });
};
