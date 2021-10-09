import { afterAll, beforeAll, expect, jest, test } from '@jest/globals';
import getPort from 'get-port';
import { dirname, join } from 'path';
import { pack } from 'tar-fs';
import { fileURLToPath } from 'url';
import { getSecretsCollection, secretDb, secretsInited } from '../src/db/secrets.js';
import docker from '../src/docker/docker.js';
import { initNetwork } from '../src/docker/network.js';
import authToken from './fixtures/authToken.js';

// mock cleanup functions
jest.unstable_mockModule('../src/docker/cleanup.js', () => import('./__mocks__/cleanup.js'));

// mock config
jest.unstable_mockModule('../src/config/index.js', () => import('./__mocks__/config.js'));
const config = await import('../src/config/index.js');

// switch config to normal
config.__load('normal');

const { startServer } = await import('../src/index.js');

// current folder
const currentDir = dirname(fileURLToPath(import.meta.url));
// create tar streams
const streamDockerImage = pack(join(currentDir, 'fixtures', 'docker-image-project'));
const streamDockerImageExternal = pack(join(currentDir, 'fixtures', 'docker-image-external'));
const streamDocker = pack(join(currentDir, 'fixtures', 'docker-project'));
const streamNode = pack(join(currentDir, 'fixtures', 'node-project'));
const streamNodeLock = pack(join(currentDir, 'fixtures', 'node-lock-project'));
const streamHtml = pack(join(currentDir, 'fixtures', 'html-project'));
const streamHtmlUpdate = pack(join(currentDir, 'fixtures', 'html-project'));
const streamCompose = pack(join(currentDir, 'fixtures', 'compose-project'));
const streamComposeUpdate = pack(join(currentDir, 'fixtures', 'compose-project'));
const streamBrokenDocker = pack(join(currentDir, 'fixtures', 'broken-docker-project'));
const streamBrokenNode = pack(join(currentDir, 'fixtures', 'broken-node-project'));
const streamBrokenTemplate = pack(join(currentDir, 'fixtures', 'broken-template-project'));
const streamBrokenCompose = pack(join(currentDir, 'fixtures', 'broken-compose-project'));
const streamBrokenComposeStart = pack(join(currentDir, 'fixtures', 'broken-compose-project-start'));
const streamAdditionalLabels = pack(join(currentDir, 'fixtures', 'additional-labels'));
const streamTemplate = pack(join(currentDir, 'fixtures', 'template-project'));

// options base
const optionsBase = {
  method: 'POST',
  url: '/deploy',
  headers: {
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/octet-stream',
  },
};

// storage vars
let fastify;
let simpleHtmlInitialDeploy = '';
let composeDeployOne = '';
let composeDeployTwo = '';

// set timeout to 120s
jest.setTimeout(120000);

beforeAll(async () => {
  // start new instance of fastify
  const port = await getPort();
  fastify = await startServer(port);
  // init docker network
  await initNetwork();
});

afterAll(() => {
  secretDb.close();
  fastify.close();
});

test('Should deploy simple docker project', async () => {
  const options = Object.assign(optionsBase, {
    payload: streamDocker,
  });

  const response = await fastify.inject(options);
  // parse result into lines
  const result = response.payload
    .split('\n')
    .filter((l) => l && l.length)
    .map((line) => JSON.parse(line));

  // find deployments
  const completeDeployments = result.find((it) => it.deployments && it.deployments.length).deployments;

  // check response
  expect(response.statusCode).toEqual(200);
  expect(completeDeployments.length).toEqual(1);
  expect(completeDeployments[0].Name.startsWith('/exo-admin-test-docker-deploy-')).toBeTruthy();

  // check docker services
  const allContainers = await docker.listContainers();
  const containerInfo = allContainers.find((c) => c.Names.includes(completeDeployments[0].Name));
  const name = completeDeployments[0].Name.slice(1);

  expect(containerInfo).toBeDefined();
  expect(containerInfo.Labels['exoframe.deployment']).toEqual(name);
  expect(containerInfo.Labels['exoframe.user']).toEqual('admin');
  expect(containerInfo.Labels['exoframe.project']).toEqual('test-project');
  expect(containerInfo.Labels['traefik.docker.network']).toEqual('exoframe');
  expect(containerInfo.Labels['traefik.enable']).toEqual('true');
  expect(containerInfo.NetworkSettings.Networks.exoframe).toBeDefined();
  expect(containerInfo.Mounts.length).toEqual(1);
  expect(containerInfo.Mounts[0].Type).toEqual('volume');
  expect(containerInfo.Mounts[0].Name).toEqual('test');
  expect(containerInfo.Mounts[0].Destination).toEqual('/volume');

  const containerData = docker.getContainer(containerInfo.Id);
  const container = await containerData.inspect();
  expect(container.NetworkSettings.Networks.exoframe.Aliases.includes('test')).toBeTruthy();
  expect(container.HostConfig.RestartPolicy).toMatchObject({ Name: 'no', MaximumRetryCount: 0 });
  expect(container.Config.Env).toContain('EXOFRAME_USER=admin');
  expect(container.Config.Env).toContain('EXOFRAME_PROJECT=test-project');
  expect(
    container.Config.Env.find((env) => env.startsWith('EXOFRAME_DEPLOYMENT=exo-admin-test-docker-deploy-'))
  ).toBeDefined();
  expect(
    container.Config.Env.find((env) => env.startsWith('EXOFRAME_HOST=exo-admin-test-docker-deploy-'))
  ).toBeDefined();

  // cleanup
  const instance = docker.getContainer(containerInfo.Id);
  await instance.remove({ force: true });
});

test('Should deploy simple project from image and image tar', async () => {
  const options = Object.assign(optionsBase, {
    payload: streamDockerImage,
  });

  const response = await fastify.inject(options);
  // parse result into lines
  const result = response.payload
    .split('\n')
    .filter((l) => l && l.length)
    .map((line) => JSON.parse(line));

  // find deployments
  const completeDeployments = result.find((it) => it.deployments && it.deployments.length).deployments;

  // check response
  expect(response.statusCode).toEqual(200);
  expect(completeDeployments.length).toEqual(1);
  expect(completeDeployments[0].Name.startsWith('/exo-test-image-')).toBeTruthy();

  // check docker services
  const allContainers = await docker.listContainers();
  const containerInfo = allContainers.find((c) => c.Names.includes(completeDeployments[0].Name));
  const name = completeDeployments[0].Name.slice(1);

  expect(containerInfo).toBeDefined();
  expect(containerInfo.Labels['exoframe.deployment']).toEqual(name);
  expect(containerInfo.Labels['exoframe.user']).toEqual('admin');
  expect(containerInfo.Labels['exoframe.project']).toEqual('test-image-project');
  expect(containerInfo.Labels['traefik.docker.network']).toEqual('exoframe');
  expect(containerInfo.Labels['traefik.enable']).toEqual('true');
  expect(containerInfo.NetworkSettings.Networks.exoframe).toBeDefined();

  const containerData = docker.getContainer(containerInfo.Id);
  const container = await containerData.inspect();
  expect(container.NetworkSettings.Networks.exoframe.Aliases.includes('testimage')).toBeTruthy();
  expect(container.HostConfig.RestartPolicy).toMatchObject({ Name: 'no', MaximumRetryCount: 0 });

  // cleanup
  const instance = docker.getContainer(containerInfo.Id);
  await instance.remove({ force: true });
});

test('Should deploy simple project from external image', async () => {
  const options = Object.assign(optionsBase, {
    payload: streamDockerImageExternal,
  });

  const response = await fastify.inject(options);
  // parse result into lines
  const result = response.payload
    .split('\n')
    .filter((l) => l && l.length)
    .map((line) => JSON.parse(line));

  // find deployments
  const completeDeployments = result.find((it) => it.deployments && it.deployments.length).deployments;

  // check response
  expect(response.statusCode).toEqual(200);
  expect(completeDeployments.length).toEqual(1);
  expect(completeDeployments[0].Name.startsWith('/busybox')).toBeTruthy();

  // check docker services
  const allContainers = await docker.listContainers({ all: true });
  const containerInfo = allContainers.find((c) => c.Names.includes(completeDeployments[0].Name));
  const name = completeDeployments[0].Name.slice(1);

  expect(containerInfo).toBeDefined();
  expect(containerInfo.Labels['exoframe.deployment']).toEqual(name);
  expect(containerInfo.Labels['exoframe.user']).toEqual('admin');
  expect(containerInfo.Labels['exoframe.project']).toEqual('test-extimage-project');
  expect(containerInfo.Labels['traefik.docker.network']).toEqual('exoframe');
  expect(containerInfo.Labels['traefik.enable']).toEqual('true');
  expect(containerInfo.NetworkSettings.Networks.exoframe).toBeDefined();

  const containerData = docker.getContainer(containerInfo.Id);
  const container = await containerData.inspect();
  expect(container.NetworkSettings.Networks.exoframe.Aliases.includes('testextimage')).toBeTruthy();
  expect(container.HostConfig.RestartPolicy).toMatchObject({ Name: 'no', MaximumRetryCount: 0 });

  // cleanup
  const instance = docker.getContainer(containerInfo.Id);
  await instance.remove({ force: true });
});

test('Should deploy simple node project', async () => {
  const options = Object.assign(optionsBase, {
    payload: streamNode,
  });

  const response = await fastify.inject(options);
  // parse result into lines
  const result = response.payload
    .split('\n')
    .filter((l) => l && l.length)
    .map((line) => JSON.parse(line));

  // find deployments
  const completeDeployments = result.find((it) => it.deployments && it.deployments.length).deployments;

  // check response
  expect(response.statusCode).toEqual(200);
  expect(completeDeployments.length).toEqual(1);
  expect(completeDeployments[0].Name.startsWith('/exo-admin-test-node-deploy-')).toBeTruthy();

  // check docker services
  const allContainers = await docker.listContainers();
  const container = allContainers.find((c) => c.Names.includes(completeDeployments[0].Name));
  const name = completeDeployments[0].Name.slice(1);
  const deployId = name.split('-').slice(-1).shift();

  expect(container).toBeDefined();
  expect(container.Labels['exoframe.deployment']).toEqual(name);
  expect(container.Labels['exoframe.user']).toEqual('admin');
  expect(container.Labels['exoframe.project']).toEqual(name.replace(`-${deployId}`, ''));
  expect(container.Labels['traefik.docker.network']).toEqual('exoframe');
  expect(container.Labels['traefik.enable']).toEqual('true');
  expect(container.Labels[`traefik.http.routers.${name}.rule`]).toEqual('Host(`localhost`)');
  expect(container.NetworkSettings.Networks.exoframe).toBeDefined();

  // cleanup
  const instance = docker.getContainer(container.Id);
  await instance.remove({ force: true });
});

test('Should deploy simple node project with package-lock', async () => {
  const options = Object.assign(optionsBase, {
    payload: streamNodeLock,
  });

  const response = await fastify.inject(options);
  // parse result into lines
  const result = response.payload
    .split('\n')
    .filter((l) => l && l.length)
    .map((line) => JSON.parse(line));

  // find deployments
  const completeDeployments = result.find((it) => it.deployments && it.deployments.length).deployments;

  // check response
  expect(response.statusCode).toEqual(200);
  expect(completeDeployments.length).toEqual(1);
  expect(completeDeployments[0].Name.startsWith('/exo-admin-test-node-lock-deploy-')).toBeTruthy();

  // check docker services
  const allContainers = await docker.listContainers();
  const container = allContainers.find((c) => c.Names.includes(completeDeployments[0].Name));
  const name = completeDeployments[0].Name.slice(1);
  const deployId = name.split('-').slice(-1).shift();

  expect(container).toBeDefined();
  expect(container.Labels['exoframe.deployment']).toEqual(name);
  expect(container.Labels['exoframe.user']).toEqual('admin');
  expect(container.Labels['exoframe.project']).toEqual(name.replace(`-${deployId}`, ''));
  expect(container.Labels['traefik.docker.network']).toEqual('exoframe');
  expect(container.Labels['traefik.enable']).toEqual('true');
  expect(container.Labels[`traefik.http.routers.${name}.rule`]).toEqual('Host(`localhost`)');
  expect(container.NetworkSettings.Networks.exoframe).toBeDefined();

  // cleanup
  const instance = docker.getContainer(container.Id);
  await instance.remove({ force: true });
});

test('Should deploy simple HTML project', async () => {
  const options = Object.assign(optionsBase, {
    payload: streamHtml,
  });

  const response = await fastify.inject(options);
  // parse result into lines
  const result = response.payload
    .split('\n')
    .filter((l) => l && l.length)
    .map((line) => JSON.parse(line));

  // find deployments
  const completeDeployments = result.find((it) => it.deployments && it.deployments.length).deployments;

  // check response
  expect(response.statusCode).toEqual(200);
  expect(completeDeployments.length).toEqual(1);
  const name = completeDeployments[0].Name.slice(1);
  expect(name.startsWith('exo-admin-test-html-deploy-')).toBeTruthy();

  // check docker services
  const allContainers = await docker.listContainers();
  const container = allContainers.find((c) => c.Names.includes(`/${name}`));

  expect(container).toBeDefined();
  expect(container.Labels['exoframe.deployment']).toEqual(name);
  expect(container.Labels['exoframe.user']).toEqual('admin');
  expect(container.Labels['exoframe.project']).toEqual('simple-html');
  expect(container.Labels['traefik.docker.network']).toEqual('exoframe');
  expect(container.Labels['traefik.enable']).toEqual('true');
  expect(container.Labels[`traefik.http.middlewares.${name}-rate.ratelimit.average`]).toEqual('1');
  expect(container.Labels[`traefik.http.middlewares.${name}-rate.ratelimit.burst`]).toEqual('5');
  expect(container.Labels[`traefik.http.routers.${name}.rule`]).toBeUndefined();
  expect(container.Labels[`traefik.http.middlewares.${name}-auth.basicauth.users`]).toEqual(
    'user:$apr1$$9Cv/OMGj$$ZomWQzuQbL.3TRCS81A1g/'
  );
  expect(container.NetworkSettings.Networks.exoframe).toBeDefined();

  // store initial deploy id
  simpleHtmlInitialDeploy = container.Id;
});

test('Should update simple HTML project', async () => {
  const options = Object.assign(optionsBase, {
    url: '/update',
    payload: streamHtmlUpdate,
  });

  const response = await fastify.inject(options);
  // parse result into lines
  const result = response.payload
    .split('\n')
    .filter((l) => l && l.length)
    .map((line) => JSON.parse(line));

  // find deployments
  const completeDeployments = result.find((it) => it.deployments && it.deployments.length).deployments;

  // check response
  expect(response.statusCode).toEqual(200);
  expect(completeDeployments.length).toEqual(1);
  const name = completeDeployments[0].Name.slice(1);
  expect(name.startsWith('exo-admin-test-html-deploy-')).toBeTruthy();

  // check docker services
  const allContainers = await docker.listContainers();
  const container = allContainers.find((c) => c.Names.includes(`/${name}`));

  expect(container).toBeDefined();
  expect(container.Labels['exoframe.deployment']).toEqual(name);
  expect(container.Labels['exoframe.user']).toEqual('admin');
  expect(container.Labels['exoframe.project']).toEqual('simple-html');
  expect(container.Labels['traefik.docker.network']).toEqual('exoframe');
  expect(container.Labels['traefik.enable']).toEqual('true');
  expect(container.Labels[`traefik.http.routers.${name}.rule`]).toBeUndefined();
  expect(container.NetworkSettings.Networks.exoframe).toBeDefined();

  // get old container
  try {
    const oldInstance = docker.getContainer(simpleHtmlInitialDeploy);
    await oldInstance.inspect();
  } catch (e) {
    expect(e.toString().includes('no such container')).toBeTruthy();
  }

  // cleanup
  const instance = docker.getContainer(container.Id);
  await instance.remove({ force: true });
});

const testSecret = { user: 'admin', name: 'test-secret', value: 'custom-secret-value' };

test('Should deploy simple compose project', async () => {
  await secretsInited;
  getSecretsCollection().insert(testSecret);

  const options = Object.assign(optionsBase, {
    payload: streamCompose,
  });

  const response = await fastify.inject(options);
  // parse result into lines
  const result = response.payload
    .split('\n')
    .filter((l) => l && l.length)
    .map((line) => JSON.parse(line));

  // find deployments
  const completeDeployments = result.find((it) => it.deployments && it.deployments.length).deployments;

  // check response
  expect(response.statusCode).toEqual(200);
  expect(completeDeployments.length).toEqual(2);
  expect(completeDeployments[0].Name.startsWith('/exo-admin-test-compose-deploy-web-')).toBeTruthy();
  expect(completeDeployments[1].Name.startsWith('/exo-admin-test-compose-deploy-redis-')).toBeTruthy();

  // check docker services
  const allContainers = await docker.listContainers();
  const containerOne = allContainers.find((c) => c.Names.includes(completeDeployments[0].Name));
  const containerTwo = allContainers.find((c) => c.Names.includes(completeDeployments[1].Name));
  const nameOne = completeDeployments[0].Name.slice(1);
  const nameTwo = completeDeployments[1].Name.slice(1);
  const deployIdOne = nameOne.split('-').slice(-1).shift();
  const deployIdTwo = nameTwo.split('-').slice(-1).shift();

  expect(containerOne).toBeDefined();
  expect(containerTwo).toBeDefined();
  expect(containerOne.Labels['exoframe.deployment']).toEqual(nameOne);
  expect(containerTwo.Labels['exoframe.deployment']).toEqual(nameTwo);
  expect(containerOne.Labels['exoframe.user']).toEqual('admin');
  expect(containerTwo.Labels['exoframe.user']).toEqual('admin');
  expect(containerOne.Labels['exoframe.project']).toEqual(nameOne.replace(`-web-${deployIdOne}`, ''));
  expect(containerTwo.Labels['exoframe.project']).toEqual(nameTwo.replace(`-redis-${deployIdTwo}`, ''));
  expect(containerOne.Labels['traefik.docker.network']).toEqual('exoframe');
  expect(containerTwo.Labels['traefik.docker.network']).toEqual('exoframe');
  expect(containerOne.Labels['traefik.enable']).toEqual('true');
  expect(containerTwo.Labels['traefik.enable']).toEqual('true');
  expect(containerOne.Labels[`traefik.http.routers.web.rule`]).toEqual('Host(`test.dev`)');
  expect(containerOne.Labels['custom.envvar']).toEqual('custom-value');
  expect(containerOne.Labels['custom.secret']).toEqual('custom-secret-value');
  expect(containerTwo.Labels.username).toEqual('user1234');
  expect(containerTwo.Labels.password).toEqual('abcde=cddfd=gdfg');
  expect(containerOne.NetworkSettings.Networks.exoframe).toBeDefined();
  expect(containerTwo.NetworkSettings.Networks.exoframe).toBeDefined();

  // store ids for update test
  composeDeployOne = containerOne.Id;
  composeDeployTwo = containerTwo.Id;
});

test('Should update simple compose project', async () => {
  const options = Object.assign(optionsBase, {
    url: '/update',
    payload: streamComposeUpdate,
  });

  const response = await fastify.inject(options);
  // parse result into lines
  const result = response.payload
    .split('\n')
    .filter((l) => l && l.length)
    .map((line) => JSON.parse(line));

  // find deployments
  const completeDeployments = result.find((it) => it.deployments && it.deployments.length).deployments;

  // check response
  expect(response.statusCode).toEqual(200);
  expect(completeDeployments.length).toEqual(2);
  expect(completeDeployments[0].Name.startsWith('/exo-admin-test-compose-deploy-web-')).toBeTruthy();
  expect(completeDeployments[1].Name.startsWith('/exo-admin-test-compose-deploy-redis-')).toBeTruthy();

  // check docker services
  const allContainers = await docker.listContainers();
  const containerOne = allContainers.find((c) => c.Names.includes(completeDeployments[0].Name));
  const containerTwo = allContainers.find((c) => c.Names.includes(completeDeployments[1].Name));
  const nameOne = completeDeployments[0].Name.slice(1);
  const nameTwo = completeDeployments[1].Name.slice(1);
  const deployIdOne = nameOne.split('-').slice(-1).shift();
  const deployIdTwo = nameTwo.split('-').slice(-1).shift();

  expect(containerOne).toBeDefined();
  expect(containerTwo).toBeDefined();
  expect(containerOne.Labels['exoframe.deployment']).toEqual(nameOne);
  expect(containerTwo.Labels['exoframe.deployment']).toEqual(nameTwo);
  expect(containerOne.Labels['exoframe.user']).toEqual('admin');
  expect(containerTwo.Labels['exoframe.user']).toEqual('admin');
  expect(containerOne.Labels['exoframe.project']).toEqual(nameOne.replace(`-web-${deployIdOne}`, ''));
  expect(containerTwo.Labels['exoframe.project']).toEqual(nameTwo.replace(`-redis-${deployIdTwo}`, ''));
  expect(containerOne.Labels['traefik.docker.network']).toEqual('exoframe');
  expect(containerTwo.Labels['traefik.docker.network']).toEqual('exoframe');
  expect(containerOne.Labels['traefik.enable']).toEqual('true');
  expect(containerTwo.Labels['traefik.enable']).toEqual('true');
  expect(containerOne.Labels[`traefik.http.routers.web.rule`]).toEqual('Host(`test.dev`)');
  expect(containerOne.Labels['custom.envvar']).toEqual('custom-value');
  expect(containerOne.Labels['custom.secret']).toEqual('custom-secret-value');
  expect(containerTwo.Labels.username).toEqual('user1234');
  expect(containerTwo.Labels.password).toEqual('abcde=cddfd=gdfg');
  expect(containerOne.NetworkSettings.Networks.exoframe).toBeDefined();
  expect(containerTwo.NetworkSettings.Networks.exoframe).toBeDefined();

  // get old containers
  try {
    const oldInstance = docker.getContainer(composeDeployOne);
    await oldInstance.inspect();
  } catch (e) {
    expect(e.toString().includes('no such container')).toBeTruthy();
  }
  try {
    const oldInstance = docker.getContainer(composeDeployTwo);
    await oldInstance.inspect();
  } catch (e) {
    expect(e.toString().includes('no such container')).toBeTruthy();
  }

  // cleanup
  const instanceOne = docker.getContainer(containerOne.Id);
  await instanceOne.remove({ force: true });
  const instanceTwo = docker.getContainer(containerTwo.Id);
  await instanceTwo.remove({ force: true });
  getSecretsCollection().remove(testSecret);
});

test('Should display error log for broken docker project', async () => {
  const options = Object.assign(optionsBase, {
    payload: streamBrokenDocker,
  });

  const response = await fastify.inject(options);
  // parse result into lines
  const result = response.payload
    .split('\n')
    .filter((l) => l && l.length)
    .map((line) => JSON.parse(line));

  // get last error
  const error = result.pop();

  // check response
  expect(response.statusCode).toEqual(200);
  expect(error.message).toEqual('Build failed! See build log for details.');
  expect(error.log[0].includes('Step 1/3 : FROM busybox')).toBeTruthy();
  expect(error.log.find((l) => l.includes('Step 2/3 : RUN exit 1'))).toBeDefined();
  expect(error.log[error.log.length - 1]).toEqual("The command '/bin/sh -c exit 1' returned a non-zero code: 1");

  // clean all exited containers
  const allContainers = await docker.listContainers({ all: true });
  const exitedWithError = allContainers.filter((c) => c.Status.includes('Exited (1)'));
  await Promise.all(exitedWithError.map((c) => docker.getContainer(c.Id)).map((c) => c.remove()));
});

test('Should display error log for broken Node.js project', async () => {
  const options = Object.assign(optionsBase, {
    payload: streamBrokenNode,
  });

  const response = await fastify.inject(options);
  // parse result into lines
  const result = response.payload
    .split('\n')
    .filter((l) => l && l.length)
    .map((line) => JSON.parse(line));

  // get last error
  const error = result.pop();

  // check response
  expect(response.statusCode).toEqual(200);
  expect(error.message).toEqual('Build failed! See build log for details.');
  expect(error.log[0].includes('FROM node:latest')).toBeTruthy();
  expect(error.log.find((l) => l.includes('RUN mkdir -p /usr/src/app'))).toBeDefined();
  expect(error.log[error.log.length - 1]).toEqual(
    "The command '/bin/sh -c npm install --silent' returned a non-zero code: 1"
  );

  // clean all exited containers
  const allContainers = await docker.listContainers({ all: true });
  const exitedWithError = allContainers.filter((c) => c.Status.includes('Exited (1)'));
  await Promise.all(exitedWithError.map((c) => docker.getContainer(c.Id)).map((c) => c.remove()));
});

test('Should display error log for project with broken template', async () => {
  const options = Object.assign(optionsBase, {
    payload: streamBrokenTemplate,
  });

  const response = await fastify.inject(options);
  // parse result into lines
  const result = response.payload
    .split('\n')
    .filter((l) => l && l.length)
    .map((line) => JSON.parse(line));

  // get last error
  const error = result.pop();

  // check response
  expect(response.statusCode).toEqual(200);
  expect(error.level).toEqual('error');
  expect(error.message).toEqual(`Build failed! Couldn't find template: do-not-exist!`);

  // clean all exited containers
  const allContainers = await docker.listContainers({ all: true });
  const exitedWithError = allContainers.filter((c) => c.Status.includes('Exited (1)'));
  await Promise.all(exitedWithError.map((c) => docker.getContainer(c.Id)).map((c) => c.remove()));
});

test('Should display error log for broken compose project build', async () => {
  const options = Object.assign(optionsBase, {
    payload: streamBrokenCompose,
  });

  const response = await fastify.inject(options);
  // parse result into lines
  const result = response.payload
    .split('\n')
    .filter((l) => l && l.length)
    .map((line) => JSON.parse(line));

  // get last error
  const error = result.pop();

  // check response
  expect(response.statusCode).toEqual(200);
  expect(error.message).toEqual(`Deployment failed! Docker-compose build exited with code: 1.`);
});

test('Should display error log for broken compose project start', async () => {
  const options = Object.assign(optionsBase, {
    payload: streamBrokenComposeStart,
  });

  const response = await fastify.inject(options);
  // parse result into lines
  const result = response.payload
    .split('\n')
    .filter((l) => l && l.length)
    .map((line) => JSON.parse(line));

  // get last error
  const error = result.pop();

  // check response
  expect(response.statusCode).toEqual(200);
  expect(error.message).toEqual(`Deployment failed! Docker-compose up exited with code: 1.`);
});

test('Should have additional labels', async () => {
  const options = Object.assign(optionsBase, {
    payload: streamAdditionalLabels,
  });

  const response = await fastify.inject(options);
  // parse result into lines
  const result = response.payload
    .split('\n')
    .filter((l) => l && l.length)
    .map((line) => JSON.parse(line));

  // find deployments
  const completeDeployments = result.find((it) => it.deployments && it.deployments.length).deployments;

  // check response
  expect(response.statusCode).toEqual(200);

  // check docker services
  const allContainers = await docker.listContainers();
  const containerInfo = allContainers.find((c) => c.Names.includes(completeDeployments[0].Name));
  expect(containerInfo).toBeDefined();
  expect(containerInfo.Labels['custom.label']).toEqual('additional-label');

  // check middlewares
  const name = completeDeployments[0].Name.slice(1);
  const middlewaresLabel = containerInfo.Labels[`traefik.http.routers.${name}.middlewares`];
  expect(middlewaresLabel).toContain('my-redirectregex@docker');
  expect(middlewaresLabel).toContain('my-test@docker');

  // cleanup
  const instance = docker.getContainer(containerInfo.Id);
  await instance.remove({ force: true });
});

test('Should deploy project with configured template', async () => {
  const options = Object.assign(optionsBase, {
    payload: streamTemplate,
  });

  const response = await fastify.inject(options);
  // parse result into lines
  const result = response.payload
    .split('\n')
    .filter((l) => l && l.length)
    .map((line) => JSON.parse(line));

  // find deployments
  const completeDeployments = result.find((it) => it.deployments && it.deployments.length).deployments;

  // check response
  expect(response.statusCode).toEqual(200);
  expect(completeDeployments.length).toEqual(1);
  expect(result[0]).toEqual({ message: 'Deploying Static HTML project..', level: 'info' });

  // check docker services
  const allContainers = await docker.listContainers();
  const container = allContainers.find((c) => c.Names.includes(completeDeployments[0].Name));
  const name = completeDeployments[0].Name.slice(1);
  expect(name.startsWith('exo-admin-test-static-deploy-')).toBeTruthy();
  const deployId = name.split('-').slice(-1).shift();

  expect(container).toBeDefined();
  expect(container.Labels['exoframe.deployment']).toEqual(name);
  expect(container.Labels['exoframe.user']).toEqual('admin');
  expect(container.Labels['exoframe.project']).toEqual(name.replace(`-${deployId}`, ''));
  expect(container.Labels['traefik.docker.network']).toEqual('exoframe');
  expect(container.Labels['traefik.enable']).toEqual('true');
  expect(container.Labels[`traefik.http.routers.${name}.rule`]).toEqual('Host(`localhost`)');
  expect(container.NetworkSettings.Networks.exoframe).toBeDefined();

  // cleanup
  const instance = docker.getContainer(container.Id);
  await instance.remove({ force: true });
});
