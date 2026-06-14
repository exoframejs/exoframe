import { randomUUID } from 'crypto';
import { copyFile, mkdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { pack } from 'tar-fs';
import { fileURLToPath } from 'url';
import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { secretDb } from '../src/db/secrets.ts';
import docker from '../src/docker/docker.ts';
import { initNetwork } from '../src/docker/network.ts';
import authToken from './fixtures/authToken.js';

// mock config
vi.mock('../src/config/index.ts', () => import('./__mocks__/config.ts'));
vi.mock('../src/config/paths.ts', () => import('./__mocks__/config.ts'));

const config = await import('../src/config/index.ts');

// switch config to normal
config.__load('normal');

// import server after mocking config
const { startServer } = await import('../src/index.ts');

// current folder
const currentDir = dirname(fileURLToPath(import.meta.url));
// create tar streams
const streamDockerImage = pack(join(currentDir, 'fixtures', 'docker-image-project'));
const streamDockerImageExternal = pack(join(currentDir, 'fixtures', 'docker-image-external'));
const streamDocker = pack(join(currentDir, 'fixtures', 'docker-project'));
const streamDockerMountType = pack(join(currentDir, 'fixtures', 'docker-project-mount-type'));
const streamDockerBuildargs = pack(join(currentDir, 'fixtures', 'docker-project-buildargs'));
const streamNode = pack(join(currentDir, 'fixtures', 'node-project'));
const streamNodeLock = pack(join(currentDir, 'fixtures', 'node-lock-project'));
const streamHtml = pack(join(currentDir, 'fixtures', 'html-project'));
const streamHtmlUpdate = pack(join(currentDir, 'fixtures', 'html-project'));
const streamBrokenUpdate = pack(join(currentDir, 'fixtures', 'broken-update-project'));
const streamBrokenDocker = pack(join(currentDir, 'fixtures', 'broken-docker-project'));
const streamBrokenNode = pack(join(currentDir, 'fixtures', 'broken-node-project'));
const streamBrokenTemplate = pack(join(currentDir, 'fixtures', 'broken-template-project'));
const streamAdditionalLabels = pack(join(currentDir, 'fixtures', 'additional-labels'));
const streamTemplate = pack(join(currentDir, 'fixtures', 'template-project'));

// options base
const optionsBase = {
  method: 'POST',
  url: '/deploy',
  headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/octet-stream' },
};

// storage vars
let fastify;
let simpleHtmlInitialDeploy = '';

beforeAll(async () => {
  // start new instance of fastify
  fastify = await startServer(0);
  // init docker network
  await initNetwork();
});

afterAll(() => {
  secretDb.close();
  fastify?.close();
});

test('Should deploy simple docker project', async () => {
  const options = Object.assign(optionsBase, { payload: streamDocker });

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
  expect(containerInfo.Labels['exoframe.deployment']).toEqual(name.split('-').slice(0, -1).join('-'));
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
    container.Config.Env.find((env) => env.startsWith('EXOFRAME_DEPLOYMENT=exo-admin-test-docker-deploy'))
  ).toBeDefined();
  expect(container.Config.Env.find((env) => env.startsWith('EXOFRAME_HOST=test-docker-deploy'))).toBeDefined();

  // cleanup
  const instance = docker.getContainer(containerInfo.Id);
  await instance.remove({ force: true });
});

test('Should deploy simple docker project with custom mount type', async () => {
  const options = Object.assign(optionsBase, { payload: streamDockerMountType });

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
  expect(completeDeployments[0].Name.startsWith('/exo-admin-test-docker-deploy-with-custom-mount-')).toBeTruthy();

  // check docker services
  const allContainers = await docker.listContainers();
  const containerInfo = allContainers.find((c) => c.Names.includes(completeDeployments[0].Name));
  const name = completeDeployments[0].Name.slice(1);

  expect(containerInfo).toBeDefined();
  expect(containerInfo.Labels['exoframe.deployment']).toEqual(name.split('-').slice(0, -1).join('-'));
  expect(containerInfo.Labels['exoframe.user']).toEqual('admin');
  expect(containerInfo.Labels['exoframe.project']).toEqual('test-mount-project');
  expect(containerInfo.Labels['traefik.docker.network']).toEqual('exoframe');
  expect(containerInfo.Labels['traefik.enable']).toEqual('true');
  expect(containerInfo.NetworkSettings.Networks.exoframe).toBeDefined();
  expect(containerInfo.Mounts.length).toEqual(1);
  expect(containerInfo.Mounts[0].Type).toEqual('bind');
  expect(containerInfo.Mounts[0].Source).toEqual('/tmp');
  expect(containerInfo.Mounts[0].Destination).toEqual('/test-temp');

  const containerData = docker.getContainer(containerInfo.Id);
  const container = await containerData.inspect();
  expect(container.NetworkSettings.Networks.exoframe.Aliases.includes('test')).toBeTruthy();
  expect(container.HostConfig.RestartPolicy).toMatchObject({ Name: 'no', MaximumRetryCount: 0 });
  expect(container.Config.Env).toContain('EXOFRAME_USER=admin');
  expect(container.Config.Env).toContain('EXOFRAME_PROJECT=test-mount-project');
  expect(
    container.Config.Env.find((env) =>
      env.startsWith('EXOFRAME_DEPLOYMENT=exo-admin-test-docker-deploy-with-custom-mount')
    )
  ).toBeDefined();
  expect(
    container.Config.Env.find((env) => env.startsWith('EXOFRAME_HOST=test-docker-deploy-with-custom-mount'))
  ).toBeDefined();

  // cleanup
  const instance = docker.getContainer(containerInfo.Id);
  await instance.remove({ force: true });
});

test('Should deploy simple docker project with buildargs', async () => {
  const options = Object.assign(optionsBase, { payload: streamDockerBuildargs });

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
  expect(completeDeployments[0].Name.startsWith('/exo-admin-test-docker-deploy-buildargs-')).toBeTruthy();

  // check docker services
  const allContainers = await docker.listContainers();
  const containerInfo = allContainers.find((c) => c.Names.includes(completeDeployments[0].Name));
  const name = completeDeployments[0].Name.slice(1);

  expect(containerInfo).toBeDefined();
  expect(containerInfo.Labels['exoframe.deployment']).toEqual(name.split('-').slice(0, -1).join('-'));
  expect(containerInfo.Labels['exoframe.user']).toEqual('admin');
  expect(containerInfo.Labels['exoframe.project']).toEqual('test-project-buildargs');
  expect(containerInfo.Labels['traefik.docker.network']).toEqual('exoframe');
  expect(containerInfo.Labels['traefik.enable']).toEqual('true');
  expect(containerInfo.NetworkSettings.Networks.exoframe).toBeDefined();

  // get container
  const instance = docker.getContainer(containerInfo.Id);

  // get logs and ensure they match build args from config
  const logs = await instance.logs({ stdout: true });
  expect(logs.toString()).toContain('test_exoframe');

  // cleanup
  await instance.remove({ force: true });
});

test('Should deploy simple project from image and image tar', async () => {
  const options = Object.assign(optionsBase, { payload: streamDockerImage });

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
  expect(containerInfo.Labels['exoframe.deployment']).toEqual(name.split('-').slice(0, -1).join('-'));
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
  const options = Object.assign(optionsBase, { payload: streamDockerImageExternal });

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
  expect(containerInfo.Labels['exoframe.deployment']).toEqual(name.split('-').slice(0, -1).join('-'));
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
  const options = Object.assign(optionsBase, { payload: streamNode });

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
  expect(container.Labels['exoframe.deployment']).toEqual(name.split('-').slice(0, -1).join('-'));
  expect(container.Labels['exoframe.user']).toEqual('admin');
  expect(container.Labels['exoframe.project']).toEqual(name.replace(`-${deployId}`, ''));
  expect(container.Labels['traefik.docker.network']).toEqual('exoframe');
  expect(container.Labels['traefik.enable']).toEqual('false');
  expect(container.Labels[`traefik.http.routers.${name}.rule`]).toBeUndefined();
  expect(container.NetworkSettings.Networks.exoframe).toBeDefined();

  // cleanup
  const instance = docker.getContainer(container.Id);
  await instance.remove({ force: true });
});

test('Should deploy simple node project with package-lock', async () => {
  const options = Object.assign(optionsBase, { payload: streamNodeLock });

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
  expect(container.Labels['exoframe.deployment']).toEqual(name.split('-').slice(0, -1).join('-'));
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
  const options = Object.assign(optionsBase, { payload: streamHtml });

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
  expect(container.Labels['exoframe.deployment']).toEqual(name.split('-').slice(0, -1).join('-'));
  expect(container.Labels['exoframe.user']).toEqual('admin');
  expect(container.Labels['exoframe.project']).toEqual('simple-html');
  expect(container.Labels['traefik.docker.network']).toEqual('exoframe');
  expect(container.Labels['traefik.enable']).toEqual('true');
  expect(container.Labels[`traefik.http.middlewares.${name}-rate.ratelimit.average`]).toEqual('1');
  expect(container.Labels[`traefik.http.middlewares.${name}-rate.ratelimit.burst`]).toEqual('5');
  expect(container.Labels[`traefik.http.routers.${name}.rule`]).toEqual('Host(`test.com`)');
  expect(container.Labels[`traefik.http.middlewares.${name}-auth.basicauth.users`]).toEqual(
    'user:$apr1$$9Cv/OMGj$$ZomWQzuQbL.3TRCS81A1g/'
  );
  expect(container.NetworkSettings.Networks.exoframe).toBeDefined();

  // store initial deploy id
  simpleHtmlInitialDeploy = container.Id;
});

test('Should update simple HTML project', async () => {
  if (!simpleHtmlInitialDeploy) {
    const deployOptions = Object.assign({}, optionsBase, {
      payload: pack(join(currentDir, 'fixtures', 'html-project')),
    });
    const deployResponse = await fastify.inject(deployOptions);
    const deployResult = deployResponse.payload
      .split('\n')
      .filter((l) => l && l.length)
      .map((line) => JSON.parse(line));
    const deployment = deployResult.find((it) => it.deployments && it.deployments.length).deployments[0];
    simpleHtmlInitialDeploy = deployment.Id;
  }

  const options = Object.assign(optionsBase, { url: '/update', payload: streamHtmlUpdate });

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
  expect(container.Labels['exoframe.deployment']).toEqual(name.split('-').slice(0, -1).join('-'));
  expect(container.Labels['exoframe.user']).toEqual('admin');
  expect(container.Labels['exoframe.project']).toEqual('simple-html');
  expect(container.Labels['traefik.docker.network']).toEqual('exoframe');
  expect(container.Labels['traefik.enable']).toEqual('true');
  expect(container.Labels[`traefik.http.routers.${name}.rule`]).toEqual('Host(`test.com`)');
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

test('Should display error log for broken docker project', async () => {
  const options = Object.assign(optionsBase, { payload: streamBrokenDocker });

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

test('Should keep existing deployment when update build fails', async () => {
  const deployOptions = Object.assign({}, optionsBase, { payload: pack(join(currentDir, 'fixtures', 'html-project')) });
  const deployResponse = await fastify.inject(deployOptions);
  const deployResult = deployResponse.payload
    .split('\n')
    .filter((l) => l && l.length)
    .map((line) => JSON.parse(line));
  const deployment = deployResult.find((it) => it.deployments && it.deployments.length).deployments[0];
  const initialName = deployment.Name;

  const updateOptions = Object.assign({}, optionsBase, { url: '/update', payload: streamBrokenUpdate });
  const updateResponse = await fastify.inject(updateOptions);
  const updateResult = updateResponse.payload
    .split('\n')
    .filter((l) => l && l.length)
    .map((line) => JSON.parse(line));
  const error = updateResult.pop();

  expect(updateResponse.statusCode).toEqual(200);
  expect(error.message).toEqual('Build failed! See build log for details.');

  const allContainers = await docker.listContainers();
  const projectContainers = allContainers.filter(
    (containerInfo) => containerInfo.Labels['exoframe.project'] === 'simple-html'
  );
  expect(projectContainers.length).toBeGreaterThan(0);
  const original = projectContainers.find((containerInfo) => containerInfo.Names.includes(initialName));
  expect(original).toBeDefined();

  await Promise.all(
    projectContainers.map((containerInfo) => docker.getContainer(containerInfo.Id).remove({ force: true }))
  );
});

test('Should keep existing deployment when remove-before update build fails', async () => {
  const deployOptions = Object.assign({}, optionsBase, {
    payload: pack(join(currentDir, 'fixtures', 'html-project-remove-before')),
  });
  const deployResponse = await fastify.inject(deployOptions);
  const deployResult = deployResponse.payload
    .split('\n')
    .filter((l) => l && l.length)
    .map((line) => JSON.parse(line));
  const deployment = deployResult.find((it) => it.deployments && it.deployments.length).deployments[0];
  const initialName = deployment.Name;

  const updateOptions = Object.assign({}, optionsBase, {
    url: '/update',
    payload: pack(join(currentDir, 'fixtures', 'broken-update-remove-before')),
  });
  const updateResponse = await fastify.inject(updateOptions);
  const updateResult = updateResponse.payload
    .split('\n')
    .filter((l) => l && l.length)
    .map((line) => JSON.parse(line));
  const error = updateResult.pop();

  expect(updateResponse.statusCode).toEqual(200);
  expect(error.message).toEqual('Build failed! See build log for details.');
  expect(
    updateResult.find((entry) => entry.message === 'Removing existing containers before deployment...')
  ).toBeUndefined();

  const allContainers = await docker.listContainers();
  const projectContainers = allContainers.filter(
    (containerInfo) => containerInfo.Labels['exoframe.project'] === 'simple-html-remove-before'
  );
  expect(projectContainers.length).toBeGreaterThan(0);
  const original = projectContainers.find((containerInfo) => containerInfo.Names.includes(initialName));
  expect(original).toBeDefined();

  await Promise.all(
    projectContainers.map((containerInfo) => docker.getContainer(containerInfo.Id).remove({ force: true }))
  );
});

test('Should remove existing deployment before starting remove-before update', async () => {
  const deployOptions = Object.assign({}, optionsBase, {
    payload: pack(join(currentDir, 'fixtures', 'html-project-remove-before')),
  });
  const deployResponse = await fastify.inject(deployOptions);
  const deployResult = deployResponse.payload
    .split('\n')
    .filter((l) => l && l.length)
    .map((line) => JSON.parse(line));
  const initialDeployment = deployResult.find((it) => it.deployments && it.deployments.length).deployments[0];

  const updateOptions = Object.assign({}, optionsBase, {
    url: '/update',
    payload: pack(join(currentDir, 'fixtures', 'html-project-remove-before')),
  });
  const updateResponse = await fastify.inject(updateOptions);
  const updateResult = updateResponse.payload
    .split('\n')
    .filter((l) => l && l.length)
    .map((line) => JSON.parse(line));
  const completeDeployments = updateResult.find((it) => it.deployments && it.deployments.length).deployments;

  expect(updateResponse.statusCode).toEqual(200);
  expect(completeDeployments.length).toEqual(1);
  const removeIndex = updateResult.findIndex(
    (entry) => entry.message === 'Removing existing containers before deployment...'
  );
  const startedIndex = updateResult.findIndex((entry) => entry.message === 'Container successfully started!');
  expect(removeIndex).toBeGreaterThan(-1);
  expect(startedIndex).toBeGreaterThan(removeIndex);

  try {
    await docker.getContainer(initialDeployment.Id).inspect();
    throw new Error('Original container still exists');
  } catch (e) {
    expect(e.toString().includes('no such container')).toBeTruthy();
  }

  const allContainers = await docker.listContainers();
  const projectContainers = allContainers.filter(
    (containerInfo) => containerInfo.Labels['exoframe.project'] === 'simple-html-remove-before'
  );
  await Promise.all(
    projectContainers.map((containerInfo) => docker.getContainer(containerInfo.Id).remove({ force: true }))
  );
});

test('Should remove existing image deployment before starting remove-before update', async () => {
  const fixtureDir = join(tmpdir(), `exoframe-image-remove-before-${randomUUID()}`);
  await mkdir(fixtureDir, { recursive: true });
  await copyFile(join(currentDir, 'fixtures', 'docker-image-project', 'image.tar'), join(fixtureDir, 'image.tar'));
  await writeFile(
    join(fixtureDir, 'exoframe.json'),
    JSON.stringify(
      {
        name: 'test-docker-image-remove-before',
        hostname: 'testimage-remove-before',
        project: 'test-image-remove-before',
        restart: 'no',
        image: 'exo-test-image',
        imageFile: 'image.tar',
        deploymentStrategy: 'removeBeforeDeploy',
      },
      null,
      2
    ),
    'utf-8'
  );

  try {
    const deployOptions = Object.assign({}, optionsBase, { payload: pack(fixtureDir) });
    const deployResponse = await fastify.inject(deployOptions);
    const deployResult = deployResponse.payload
      .split('\n')
      .filter((l) => l && l.length)
      .map((line) => JSON.parse(line));
    const initialDeployment = deployResult.find((it) => it.deployments && it.deployments.length).deployments[0];

    const updateOptions = Object.assign({}, optionsBase, { url: '/update', payload: pack(fixtureDir) });
    const updateResponse = await fastify.inject(updateOptions);
    const updateResult = updateResponse.payload
      .split('\n')
      .filter((l) => l && l.length)
      .map((line) => JSON.parse(line));
    const completeDeployments = updateResult.find((it) => it.deployments && it.deployments.length).deployments;

    expect(updateResponse.statusCode).toEqual(200);
    expect(completeDeployments.length).toEqual(1);
    expect(
      updateResult.find((entry) => entry.message === 'Removing existing containers before deployment...')
    ).toBeDefined();

    try {
      await docker.getContainer(initialDeployment.Id).inspect();
      throw new Error('Original image container still exists');
    } catch (e) {
      expect(e.toString().includes('no such container')).toBeTruthy();
    }

    const allContainers = await docker.listContainers();
    const projectContainers = allContainers.filter(
      (containerInfo) => containerInfo.Labels['exoframe.project'] === 'test-image-remove-before'
    );
    await Promise.all(
      projectContainers.map((containerInfo) => docker.getContainer(containerInfo.Id).remove({ force: true }))
    );
  } finally {
    await rm(fixtureDir, { force: true, recursive: true });
  }
});

test('Should display error log for broken Node.js project', async () => {
  const options = Object.assign(optionsBase, { payload: streamBrokenNode });

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
  const options = Object.assign(optionsBase, { payload: streamBrokenTemplate });

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

test('Should have additional labels', async () => {
  const options = Object.assign(optionsBase, { payload: streamAdditionalLabels });

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
  const options = Object.assign(optionsBase, { payload: streamTemplate });

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
  expect(container.Labels['exoframe.deployment']).toEqual(name.split('-').slice(0, -1).join('-'));
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
