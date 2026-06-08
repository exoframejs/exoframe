import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import docker from '../src/docker/docker.ts';
import { pullImage } from '../src/docker/util.ts';
import authToken from './fixtures/authToken.js';

// mock config
vi.mock('../src/config/index.ts', () => import('./__mocks__/config.ts'));
vi.mock('../src/config/paths.ts', () => import('./__mocks__/config.ts'));

// import server after mocking config
const { startServer } = await import('../src/index.ts');
const { generateLogsConfig } = await import('../src/routes/logs.ts');

// options base
const baseOptions = { method: 'GET', headers: { Authorization: `Bearer ${authToken}` } };

const generateContainerConfig = ({ name, cmd, username, project }) => ({
  Image: 'busybox:latest',
  Cmd: ['sh', '-c', `${cmd}; sleep 1000`],
  name,
  Labels: {
    'exoframe.deployment': name,
    'exoframe.user': username,
    'exoframe.project': project,
    [`traefik.http.routers.${name}.rule`]: `Host(\`test\`)`,
  },
});

// project & container names
const containerName = 'logtest1';
const projectName = 'logtestproject';

// container vars
let fastify;
let container;
let projectContainer1;
let projectContainer2;

beforeAll(async () => {
  // start server
  fastify = await startServer(0);

  // pull busybox:latest
  await pullImage('busybox:latest');

  // create test container to get single deployment logs
  const containerConfig = generateContainerConfig({
    cmd: 'echo "123"',
    name: containerName,
    username: 'admin',
    project: 'logtest1',
    baseName: 'exo-admin-logtest1',
  });
  container = await docker.createContainer(containerConfig);
  await container.start();
  // create test deployments to get project logs
  // first project container
  const prjContainerConfig1 = generateContainerConfig({
    cmd: 'echo "123"',
    name: 'logtest2',
    username: 'admin',
    project: projectName,
    baseName: 'exo-admin-logtest2',
  });
  projectContainer1 = await docker.createContainer(prjContainerConfig1);
  await projectContainer1.start();
  // second project container
  const prjContainerConfig2 = generateContainerConfig({
    cmd: 'echo "asd"',
    name: 'logtest3',
    username: 'admin',
    project: projectName,
    baseName: 'exo-admin-logtest3',
  });
  projectContainer2 = await docker.createContainer(prjContainerConfig2);
  await projectContainer2.start();
});

afterAll(() => fastify?.close());

test('Should generate logs config with tail and date filters', () => {
  const config = generateLogsConfig({
    follow: true,
    tail: '10',
    since: '2017-05-18T15:16:40Z',
    until: '2017-05-19T15:16:40Z',
  });

  expect(config).toMatchObject({
    follow: true,
    stdout: true,
    stderr: true,
    timestamps: true,
    tail: 10,
    since: 1495120600,
    until: 1495207000,
  });
});

test('Should reject invalid log tail', () => {
  expect(() => generateLogsConfig({ tail: 'asd' })).toThrowError('Invalid tail value!');
});

test('Should reject invalid log dates', () => {
  expect(() => generateLogsConfig({ since: 'not-a-date' })).toThrowError('Invalid date value!');
});

test('Should get logs for current deployment', async () => {
  const options = Object.assign({}, baseOptions, { url: `/logs/${containerName}` });

  const response = await fastify.inject(options);
  // check response
  expect(response.statusCode).toEqual(200);

  // check logs
  const lines = response.payload
    // split by lines
    .split('\n')
    // remove unicode chars
    .map((line) => line.replace(/^\u0001.+?\d/, '').replace(/\n+$/, ''))
    // filter blank lines
    .filter((line) => line && line.length > 0)
    // remove timestamps
    .map((line) => {
      const parts = line.split(/\dZ\s/);
      return parts[1].replace(/\sv\d.+/, ''); // strip version suffixes
    });
  expect(lines).toMatchObject(['123']);

  // cleanup
  await container.remove({ force: true });
});

test('Should get logs for current project', async () => {
  // options base
  const options = Object.assign({}, baseOptions, { url: `/logs/${projectName}` });

  const response = await fastify.inject(options);
  // check response
  expect(response.statusCode).toEqual(200);

  const text = response.payload
    // split by lines
    .split('\n')
    // remove unicode chars
    .map((line) => line.replace(/^\u0001.+?\d/, '').replace(/\n+$/, ''))
    // filter blank lines
    .filter((line) => line && line.length > 0)
    // remove timestamps
    .map((line) => {
      if (line.startsWith('Logs for')) {
        return line;
      }
      const parts = line.split(/\dZ\s/);
      return parts[1].replace(/\sv\d.+/, ''); // strip version suffixes
    });
  expect(text).toMatchObject(['Logs for logtest3', 'asd', 'Logs for logtest2', '123']);

  // cleanup
  await projectContainer1.remove({ force: true });
  await projectContainer2.remove({ force: true });
});

test('Should get logs for exoframe-server', async () => {
  const options = Object.assign({}, baseOptions, { url: '/logs/exoframe-server' });

  const response = await fastify.inject(options);
  // check response
  expect(response.statusCode).toEqual(200);

  // check logs
  const lines = response.payload
    // split by lines
    .split('\n')
    // remove unicode chars
    .map((line) => line.replace(/^\u0001.+?\d/, '').replace(/\n+$/, ''))
    // filter blank lines
    .filter((line) => line && line.length > 0)
    // remove timestamps
    .map((line) => {
      const parts = line.split(/\dZ\s/);
      return parts[1].replace(/\sv\d.+/, ''); // strip version suffixes
    });
  expect(lines).toMatchObject(['Exoframe server not running in container!']);
});

test('Should not get logs for nonexistent project', async () => {
  // options base
  const options = Object.assign({}, baseOptions, { url: `/logs/do-not-exist` });

  const response = await fastify.inject(options);
  const result = JSON.parse(response.payload);
  // check response
  expect(response.statusCode).toEqual(404);
  expect(result).toMatchObject({ error: 'Container not found!' });
});
