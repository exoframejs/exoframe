import { afterAll, beforeAll, expect, jest, test } from '@jest/globals';
import getPort from 'get-port';
import docker from '../src/docker/docker.js';
import { pullImage } from '../src/docker/util.js';
import { startServer } from '../src/index.js';
import authToken from './fixtures/authToken.js';

// mock config
jest.unstable_mockModule('../src/config/index.js', () => import('./__mocks__/config.js'));

// options base
const baseOptions = {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${authToken}`,
  },
  payload: {},
};

// project & container names
const containerName = 'rmtest1';
const projectName = 'rmtestproject';

// fastify ref
let fastify;

const generateContainerConfig = ({ name, username, project, baseName, url }) => ({
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

// set timeout to 60s
jest.setTimeout(60000);

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

  return fastify;
});

afterAll(() => fastify.close());

test('Should remove current deployment', async () => {
  const options = Object.assign({}, baseOptions, {
    url: `/remove/${containerName}`,
  });

  const response = await fastify.inject(options);
  // check response
  expect(response.statusCode).toEqual(204);

  // check docker services
  const allContainers = await docker.listContainers();
  const exContainer = allContainers.find((c) => c.Names.includes(`/${containerName}`));
  expect(exContainer).toBeUndefined();
});

test('Should remove current project', async () => {
  // options base
  const options = Object.assign({}, baseOptions, {
    url: `/remove/${projectName}`,
  });

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
  const options = Object.assign({}, baseOptions, {
    url: `/remove/do-not-exist`,
  });

  const response = await fastify.inject(options);
  const result = JSON.parse(response.payload);
  // check response
  expect(response.statusCode).toEqual(404);
  expect(result).toMatchObject({ error: 'Container or function not found!' });
});

test('Should remove by url', async () => {
  const options = Object.assign({}, baseOptions, {
    url: `/remove/test.example.com`,
  });

  const response = await fastify.inject(options);

  expect(response.statusCode).toEqual(204);
});
