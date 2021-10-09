import { listFunctions } from 'exoframe-faas';
import { getConfig } from '../config/index.js';
import docker from '../docker/docker.js';
import logger from '../logger/index.js';
import { getPlugins } from '../plugins/index.js';
import { functionToContainerFormat } from '../util/index.js';

export default (fastify) => {
  fastify.route({
    method: 'GET',
    path: '/list',
    async handler(request, reply) {
      // get username
      const { username } = request.user;

      // get config
      const config = getConfig();

      // get functions
      const functions = listFunctions({ functionToContainerFormat });

      // get containers
      const allContainers = await docker.listContainers({ all: true });
      const userContainers = await Promise.all(
        allContainers
          .filter((c) => c.Labels['exoframe.user'] === username) // get only user containers
          .filter((c) => !c.Names.find((n) => n === `/${config.traefikName}`)) // filter out traefik
          .map((c) => docker.getContainer(c.Id))
          .map((c) => c.inspect())
      );

      // run list via plugins if available
      const plugins = getPlugins();
      for (const plugin of plugins) {
        // only run plugins that have list function
        if (!plugin.list) {
          continue;
        }

        const result = await plugin.list({ docker, username, config });
        logger.debug('Running list with plugin:', plugin.config.name, result);
        if (result && plugin.config.exclusive) {
          logger.debug('List finished via exclusive plugin:', plugin.config.name);
          reply.send({ containers: userContainers.concat(functions), ...result });
          return;
        }
      }

      // return results
      reply.send({ containers: userContainers.concat(functions), services: [] });
    },
  });
};
