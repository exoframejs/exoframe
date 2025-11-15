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
const baseOptions = { method: 'POST', headers: { Authorization: `Bearer ${authToken}` }, payload: {} };

// project & container names
const containerName = 'rmtest1';
const projectName = 'rmtestproject';

// fastify ref
let fastify;

const generateContainerConfig = ({ name, username, project, url }) => ({
  Image: 'busybox:latest',
  Cmd: ['sh', '-c', 'sleep 1000'],
  name,
  Labels: {
    'exoframe.deployment': name,
    'exoframe.user': username,
    'exoframe.project': project,
    [`traefik.http.routers.${name}.rule`]: `Host(\`${url}\`)`,
  },
});

const testUrl = 'rmtest.example.com';

beforeAll(async () => {
  // start server
  const port = await getPort();
  fastify = await startServer(port);

  // pull busybox:latest
  await pullImage('busybox:latest');

  // create test container to get single deployment logs
  const containerConfig = generateContainerConfig({
    name: containerName,
    username: 'admin',
    project: 'rmtest1',
    baseName: 'exo-admin-rmtest1',
    url: 'test',
  });
  const container = await docker.createContainer(containerConfig);
  await container.start();
  // create test container with url to remove
  // second project container
  const urlContainerConfig = generateContainerConfig({
    name: 'rmtest12',
    username: 'admin',
    project: 'rmtest12',
    baseName: 'exo-admin-rmtest12',
    url: testUrl,
  });
  const urlContainer = await docker.createContainer(urlContainerConfig);
  await urlContainer.start();
  // create test project to remove
  // first project container
  const prjContainerConfig1 = generateContainerConfig({
    name: 'rmtest2',
    username: 'admin',
    project: projectName,
    baseName: 'exo-admin-rmtest2',
    url: 'test',
  });
  const projectContainer1 = await docker.createContainer(prjContainerConfig1);
  await projectContainer1.start();
  // second project container
  const prjContainerConfig2 = generateContainerConfig({
    name: 'rmtest3',
    username: 'admin',
    project: projectName + '_custom',
    baseName: 'exo-admin-rmtest3',
    url: 'test.example.com',
  });
  const projectContainer2 = await docker.createContainer(prjContainerConfig2);
  await projectContainer2.start();
});

afterAll(() => fastify.close());

test('Should remove current deployment', async () => {
  const options = Object.assign({}, baseOptions, { url: `/remove/${containerName}` });

  const response = await fastify.inject(options);
  // check response
  expect(response.statusCode).toEqual(204);

  // check docker services
  const allContainers = await docker.listContainers();
  const exContainer = allContainers.find((c) => c.Names.includes(`/${containerName}`));
  expect(exContainer).toBeUndefined();
});

test('Should remove container by url', async () => {
  // options base
  const options = Object.assign({}, baseOptions, { url: `/remove/${encodeURIComponent(testUrl)}` });

  const response = await fastify.inject(options);
  // check response
  expect(response.statusCode).toEqual(204);

  // check docker services
  const allContainers = await docker.listContainers();
  const urlContainers = allContainers.filter((c) =>
    c.Labels[`traefik.http.routers.${c.Labels['exoframe.deployment']}.rule`].includes(testUrl)
  );
  expect(urlContainers.length).toEqual(0);
});

test('Should remove current project', async () => {
  // options base
  const options = Object.assign({}, baseOptions, { url: `/remove/${projectName}` });

  const response = await fastify.inject(options);
  // check response
  expect(response.statusCode).toEqual(204);

  // check docker services
  const allContainers = await docker.listContainers();
  const prjContainers = allContainers.filter((c) => c.Labels['exoframe.project'] === projectName);
  expect(prjContainers.length).toEqual(0);
});

test('Should return error when removing nonexistent project', async () => {
  // options base
  const options = Object.assign({}, baseOptions, { url: `/remove/do-not-exist` });

  const response = await fastify.inject(options);
  const result = JSON.parse(response.payload);
  // check response
  expect(response.statusCode).toEqual(404);
  expect(result).toMatchObject({ error: 'Container or function not found!' });
});

test('Should remove by url', async () => {
  const options = Object.assign({}, baseOptions, { url: `/remove/test.example.com` });

  const response = await fastify.inject(options);

  expect(response.statusCode).toEqual(204);
});
