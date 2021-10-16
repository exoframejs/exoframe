import { listFunctions } from 'exoframe-faas';
import { getConfig } from '../config/index.js';
import docker from '../docker/docker.js';
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

      // return results
      reply.send({ containers: userContainers.concat(functions), services: [] });
    },
  });
};
