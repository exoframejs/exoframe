import { getLogsForFunction } from 'exoframe-faas';
import _ from 'highland';
import { Readable } from 'stream';
import docker from '../docker/docker.js';

const generateLogsConfig = (follow) => ({
  follow: Boolean(follow),
  stdout: true,
  stderr: true,
  timestamps: true,
});

// fix for dockerode returning array of strings instead of log stream
const fixLogStream = (logs) => {
  if (typeof logs === 'string') {
    return _(logs.split('\n').map((l) => `${l}\n`));
  }

  return logs;
};

const getContainerLogs = async ({ username, id, reply, follow }) => {
  const allContainers = await docker.listContainers({ all: true });
  const serverContainer = allContainers.find((c) => c.Names.find((n) => n.startsWith(`/exoframe-server`)));

  // if user asked for server logs - just send them back
  if (id === 'exoframe-server') {
    // if not running in container - just notify user
    if (!serverContainer) {
      const logStream = fixLogStream(`${new Date().toISOString()} Exoframe server not running in container!`);
      reply.send(logStream);
      return;
    }
    const container = docker.getContainer(serverContainer.Id);
    const logs = await container.logs(generateLogsConfig(follow));
    const logStream = fixLogStream(logs);
    reply.send(logStream);
    return;
  }

  // try to find container by user and name
  const containerInfo = allContainers.find(
    (c) => c.Labels['exoframe.user'] === username && c.Names.find((n) => n === `/${id}`)
  );
  if (containerInfo) {
    const container = docker.getContainer(containerInfo.Id);
    const logs = await container.logs(generateLogsConfig(follow));
    const logStream = fixLogStream(logs);
    reply.send(logStream);
    return;
  }

  // if not found by name - try to find by project
  const containers = allContainers.filter(
    (c) => c.Labels['exoframe.user'] === username && c.Labels['exoframe.project'] === id
  );
  if (!containers.length) {
    reply.code(404).send({ error: 'Container not found!' });
    return;
  }

  // get all log streams and prepend them with service names
  const logRequests = await Promise.all(
    containers.map(async (cInfo) => {
      const container = docker.getContainer(cInfo.Id);
      const logs = await container.logs(generateLogsConfig(follow));
      const logStream = fixLogStream(logs);
      const name = cInfo.Names[0].replace(/^\//, '');
      const nameStream = _([`Logs for ${name}\n\n`]);
      return [nameStream, logStream];
    })
  );
  // flatten results
  const allLogsStream = _(logRequests).flatten();
  // send wrapped highland stream as response
  reply.send(new Readable().wrap(allLogsStream));
};

export default (fastify) => {
  fastify.route({
    method: 'GET',
    path: '/logs/:id',
    async handler(request, reply) {
      // get username
      const { username } = request.user;
      const { id } = request.params;
      const { follow } = request.query;

      // try to get function logs first
      const fnLogs = getLogsForFunction(id);
      if (fnLogs) {
        // wrap logs into stream
        const logsStream = _(fnLogs).flatten();
        // send wrapped highland stream as response
        reply.send(new Readable().wrap(logsStream));
        return;
      }

      // get container logs
      getContainerLogs({ username, id, reply, follow });
    },
  });
};
