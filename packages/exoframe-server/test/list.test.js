import getPort from 'get-port';
import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import docker from '../src/docker/docker.js';
import { pullImage } from '../src/docker/util.js';
import authToken from './fixtures/authToken.js';

// mock config
vi.mock('../src/config/index.js', () => import('./__mocks__/config.js'));

// import server after mocking config
const { startServer } = await import('../src/index.js');

// options base
const options = {
  method: 'GET',
  url: '/list',
  headers: {
    Authorization: `Bearer ${authToken}`,
  },
};

const generateContainerConfig = ({ name, username, project, baseName }) => ({
  Image: 'busybox:latest',
  Cmd: ['sh', '-c', 'sleep 1000'],
  name,
  Labels: {
    'exoframe.deployment': name,
    'exoframe.user': username,
    'exoframe.project': project,
    [`traefik.http.routers.${name}.rule`]: 'Host(`test`)',
  },
});

let fastify;
let containerConfig1;
let container1;
let containerConfig2;
let container2;

beforeAll(async () => {
  // start server
  const port = await getPort();
  fastify = await startServer(port);

  // pull busybox:latest
  await pullImage('busybox:latest');

  // create test deployments to list
  containerConfig1 = generateContainerConfig({
    name: 'listtest1',
    username: 'admin',
    project: 'listtest1',
    baseName: 'exo-admin-listtest1',
  });
  containerConfig2 = generateContainerConfig({
    name: 'listtest2',
    username: 'admin',
    project: 'listtest2',
    baseName: 'exo-admin-listtest2',
  });
  [container1, container2] = await Promise.all([
    docker.createContainer(containerConfig1),
    docker.createContainer(containerConfig2),
  ]);
  await Promise.all([container1.start(), container2.start()]);
});

afterAll(() => fastify.close());

test('Should list deployed projects', async () => {
  const response = await fastify.inject(options);
  const result = JSON.parse(response.payload);

  // check response
  expect(response.statusCode).toEqual(200);
  expect(result.services).toBeDefined();
  expect(result.containers).toBeDefined();
  expect(result.containers.length).toBeGreaterThanOrEqual(2);

  // check container info
  const container = result.containers.find((c) => c.Name.includes('listtest1'));
  expect(container.Name.startsWith(`/${containerConfig1.name}`)).toBeTruthy();
  expect(container.Config.Labels['exoframe.deployment']).toEqual(containerConfig1.Labels['exoframe.deployment']);
  expect(container.Config.Labels['exoframe.user']).toEqual(containerConfig1.Labels['exoframe.user']);
  expect(container.Config.Labels[`traefik.http.routers.${containerConfig1.name}.rule`]).toEqual(
    containerConfig1.Labels[`traefik.http.routers.${containerConfig1.name}.rule`]
  );

  // check second container info
  const containerTwo = result.containers.find((r) => r.Name.startsWith(`/${containerConfig2.name}`));
  expect(containerTwo.Name.startsWith(`/${containerConfig2.name}`)).toBeTruthy();
  expect(containerTwo.Config.Labels['exoframe.deployment'].startsWith(containerConfig2.name)).toBeTruthy();
  expect(containerTwo.Config.Labels['exoframe.user']).toEqual(containerConfig2.Labels['exoframe.user']);
  expect(containerTwo.Config.Labels[`traefik.http.routers.${containerConfig2.name}.rule`]).toEqual('Host(`test`)');

  await container1.remove({ force: true });
  await container2.remove({ force: true });
});
