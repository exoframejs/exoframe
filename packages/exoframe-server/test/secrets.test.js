import getPort from 'get-port';
import { dirname, join } from 'path';
import { pack } from 'tar-fs';
import { fileURLToPath } from 'url';
import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { getSecretsCollection } from '../src/db/secrets.js';
import docker from '../src/docker/docker.js';
import authToken from './fixtures/authToken.js';

// mock config
vi.mock('../src/config/index.js', () => import('./__mocks__/config.js'));

const config = await import('../src/config/index.js');

// switch config to normal
config.__load('normal');

// import server after mocking config
const { startServer } = await import('../src/index.js');

// create tar streams
const currentDir = dirname(fileURLToPath(import.meta.url));
const streamDocker = pack(join(currentDir, 'fixtures', 'secrets-project'));

// test secret
const testSecret = { secretName: 'test-secret', secretValue: 'test-secret-value' };

// container vars
let fastify;

beforeAll(async () => {
  // start server
  const port = await getPort();
  fastify = await startServer(port);
});

afterAll(() => fastify.close());

test('Should create new secret', async () => {
  // options base
  const options = {
    method: 'POST',
    url: '/secrets',
    headers: { Authorization: `Bearer ${authToken}` },
    payload: testSecret,
  };

  const response = await fastify.inject(options);
  const result = JSON.parse(response.payload);

  // check response
  expect(response.statusCode).toEqual(200);
  expect(result.name).toEqual(testSecret.secretName);
  expect(result.value).toEqual(testSecret.secretValue);
  expect(result.user).toEqual('admin');
});

test('Should get list with new secret', async () => {
  // options base
  const options = { method: 'GET', url: '/secrets', headers: { Authorization: `Bearer ${authToken}` } };

  const response = await fastify.inject(options);
  const result = JSON.parse(response.payload);

  // check response
  expect(response.statusCode).toEqual(200);
  expect(result.secrets).toBeDefined();
  expect(result.secrets.length).toEqual(1);
  expect(result.secrets[0].user).toEqual('admin');
  expect(result.secrets[0].name).toEqual(testSecret.secretName);
  expect(result.secrets[0].value).toBeUndefined();
});

test('Should get value for the secret', async () => {
  // options base
  const options = {
    method: 'GET',
    url: `/secrets/${testSecret.secretName}`,
    headers: { Authorization: `Bearer ${authToken}` },
  };

  const response = await fastify.inject(options);
  const result = JSON.parse(response.payload);

  // check response
  expect(response.statusCode).toEqual(200);
  expect(result.secret).toBeDefined();
  expect(result.secret.user).toEqual('admin');
  expect(result.secret.name).toEqual(testSecret.secretName);
  expect(result.secret.value).toEqual(testSecret.secretValue);
});

test('Should deploy simple docker project with secret', async () => {
  const options = {
    method: 'POST',
    url: '/deploy',
    headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/octet-stream' },
    payload: streamDocker,
  };

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
  expect(completeDeployments[0].Name.startsWith('/exo-admin-test-secrets-deploy-')).toBeTruthy();

  // check docker services
  const allContainers = await docker.listContainers();
  const containerInfo = allContainers.find((c) => c.Names.includes(completeDeployments[0].Name));
  expect(containerInfo).toBeDefined();

  const containerData = docker.getContainer(containerInfo.Id);
  const container = await containerData.inspect();

  // check secrets replacement in env vars
  const [key, value] = container.Config.Env.map((v) => v.split('=')).find(([key]) => key === 'test');
  expect(key).toEqual('test');
  expect(value).toEqual(testSecret.secretValue);

  // get instance
  const instance = docker.getContainer(containerInfo.Id);

  // validate that logs include secret as output as part of build args
  const logs = await instance.logs({ stdout: true });
  expect(logs.toString()).toContain(testSecret.secretValue);

  // cleanup
  await instance.remove({ force: true });
});

test('Should delete new secret', async () => {
  // options base
  const options = {
    method: 'DELETE',
    url: '/secrets',
    headers: { Authorization: `Bearer ${authToken}` },
    payload: { secretName: testSecret.secretName },
  };

  // check response
  const response = await fastify.inject(options);
  expect(response.statusCode).toEqual(204);

  // make sure it's no longer in db
  expect(getSecretsCollection().find()).toEqual([]);
});
