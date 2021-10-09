import { pruneDocker } from '../docker/util.js';

export default (fastify) => {
  fastify.route({
    method: 'POST',
    path: '/system/prune',
    async handler(request, reply) {
      const result = await pruneDocker();
      reply.send({ pruned: true, data: result });
    },
  });
};
