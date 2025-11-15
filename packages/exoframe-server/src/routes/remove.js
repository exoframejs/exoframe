import docker from '../docker/docker.js';
import { removeContainer } from '../docker/util.js';

// removal of normal containers
const removeUserContainer = async ({ username, id, reply }) => {
  // look for normal containers
  const allContainers = await docker.listContainers({ all: true });
  const containerInfo = allContainers.find(
    (c) => c.Labels['exoframe.user'] === username && c.Names.find((n) => n === `/${id}`)
  );

  // if container found by name - remove
  if (containerInfo) {
    await removeContainer(containerInfo);
    return reply.code(204).send('removed');
  }

  // if not found by name - try to find by domain.
  const containerByUrl = allContainers.find((c) => {
    return (
      c.Labels['exoframe.user'] === username &&
      c.Labels[`traefik.http.routers.${c.Labels['exoframe.deployment']}.rule`].includes(id)
    );
  });
  if (containerByUrl) {
    await removeContainer(containerByUrl);
    return reply.code(204).send('removed');
  }

  // if not found by name and url - try to find by project
  const containersByProject = allContainers.filter(
    (c) => c.Labels['exoframe.user'] === username && c.Labels['exoframe.project'] === id
  );

  if (containersByProject.length) {
    await Promise.all(containersByProject.map(removeContainer));
    return reply.code(204).send('removed');
  }

  return reply.code(404).send({ error: 'Container or function not found!' });
};

export default (fastify) => {
  fastify.route({
    method: 'POST',
    path: '/remove/:id',
    async handler(request, reply) {
      // get username
      const { username } = request.user;
      const { id } = request.params;

      return await removeUserContainer({ username, id, reply });
    },
  });
};
