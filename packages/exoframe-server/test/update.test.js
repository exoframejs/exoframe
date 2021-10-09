import { afterAll, beforeAll, expect, jest, test } from '@jest/globals';
import getPort from 'get-port';
import docker from '../src/docker/docker.js';
import { initDocker } from '../src/docker/init.js';
import { pullImage } from '../src/docker/util.js';
import { startServer } from '../src/index.js';
import { sleep } from '../src/util/index.js';
import authToken from './fixtures/authToken.js';

// mock config
jest.unstable_mockModule('../src/config', () => import('./__mocks__/config.js'));

// old traefik and server images
const traefikTag = 'traefik:1.3-alpine';
const traefikVersion = 'latest';
const traefikNewTag = `traefik:${traefikVersion}`;
const serverTag = 'exoframe/server:1.0.0';

// options base
const baseOptions = {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${authToken}`,
  },
  payload: {},
};

// container vars
let fastify;
let oldTraefik;
let oldServer;

// set timeout to 60s because we need to pull stuff
jest.setTimeout(60000);

beforeAll(async () => {
  // start server
  const port = await getPort();
  fastify = await startServer(port);

  // pull older traefik image
  // remove current images
  // get all images
  const oldImages = await docker.listImages();
  // remove current :latest images
  const latestTraefik = oldImages.find((img) => img.RepoTags && img.RepoTags.includes(traefikNewTag));
  if (latestTraefik) {
    const limg = docker.getImage(latestTraefik.Id);
    await limg.remove({ force: true });
  }
  const latestServer = oldImages.find((img) => img.RepoTags && img.RepoTags.includes('exoframe/server:latest'));
  if (latestServer) {
    const lsimg = docker.getImage(latestServer.Id);
    await lsimg.remove({ force: true });
  }
  // pull older images
  await pullImage(traefikTag);
  await pullImage(serverTag);
  // get all images
  const images = await docker.listImages();
  // get old one and tag it as latest
  oldTraefik = images.find((img) => img.RepoTags && img.RepoTags.includes(traefikTag));
  const timg = docker.getImage(oldTraefik.Id);
  await timg.tag({ repo: 'traefik', tag: traefikVersion });
  oldServer = images.find((img) => img.RepoTags && img.RepoTags.includes(serverTag));
  const simg = docker.getImage(oldServer.Id);
  await simg.tag({ repo: 'exoframe/server', tag: 'latest' });

  // start old server instance
  const srvConfig = {
    Image: 'exoframe/server:latest',
    name: `exoframe-server-test`,
    Env: ['test=var'],
    Labels: { test: 'label' },
    HostConfig: {
      Binds: ['/var/run/docker.sock:/var/run/docker.sock'],
    },
  };
  // start server
  const oldServerContainer = await docker.createContainer(srvConfig);
  await oldServerContainer.start();

  return fastify;
});

afterAll(() => fastify.close());

test('Should deploy traefik', async () => {
  // remove any existing containers first
  const initialContainers = await docker.listContainers({ all: true });
  // try to find traefik instance
  const traefik = initialContainers.find((c) => c.Names.find((n) => n === '/exoframe-traefik'));
  // if found - stop/remove
  if (traefik) {
    const traefikContainer = docker.getContainer(traefik.Id);
    if (!traefik.Status.includes('Exited')) {
      await traefikContainer.stop();
    }
    await traefikContainer.remove();
  }

  // call init
  await initDocker();

  // check docker services
  const allContainers = await docker.listContainers();
  const container = allContainers.find((c) => c.Names.find((n) => n === '/exoframe-traefik'));

  expect(container).toBeDefined();
  expect(container.Names[0]).toEqual('/exoframe-traefik');
  expect(container.Labels['exoframe.deployment']).toEqual('exo-traefik');
  expect(container.Labels['exoframe.user']).toEqual('admin');
  expect(container.NetworkSettings.Networks.exoframe).toBeDefined();
  expect(container.Ports.length).toEqual(4);
  expect(container.Ports.find((p) => p.PrivatePort === 443)).toBeTruthy();
  expect(container.Ports.find((p) => p.PublicPort === 443)).toBeTruthy();
  expect(container.Ports.find((p) => p.PrivatePort === 80)).toBeTruthy();
  expect(container.Ports.find((p) => p.PublicPort === 80)).toBeTruthy();
  expect(container.Mounts.find((m) => m.Destination === '/var/run/docker.sock')).toBeTruthy();
  expect(container.Mounts.find((m) => m.Destination === '/var/traefik')).toBeTruthy();

  // cleanup
  const instance = docker.getContainer(container.Id);
  await instance.stop();
  await instance.remove();
});

// run update test
test('Should update traefik', async () => {
  const options = Object.assign({}, baseOptions, {
    url: '/update/traefik',
  });

  const response = await fastify.inject(options);
  // check response
  expect(response.statusCode).toEqual(200);

  // check docker services
  const allImages = await docker.listImages();
  const newTraefik = allImages.find((it) => it.RepoTags && it.RepoTags.includes(traefikNewTag));
  expect(newTraefik.Id).not.toBe(oldTraefik.Id);
});

// run update test
test('Should update server', async () => {
  // options base
  const options = Object.assign({}, baseOptions, {
    url: '/update/server',
  });

  const response = await fastify.inject(options);
  // check response
  expect(response.statusCode).toEqual(200);

  // check docker services
  const allImages = await docker.listImages();
  const newServer = allImages.find((it) => it.RepoTags && it.RepoTags.includes('exoframe/server:latest'));
  expect(newServer.Id).not.toBe(oldServer.Id);

  // wait for removal of old server
  await sleep(1500);
  try {
    const oldServerContainer = docker.getContainer(oldServer.Id);
    await oldServerContainer.inspect();
  } catch (e) {
    expect(e.message).toContain('no such container');
  }

  // cleanup
  const allContainers = await docker.listContainers({ all: true });
  const containerTraefik = allContainers.find((c) => c.Names.find((n) => n.startsWith('/exoframe-traefik')));
  const containerServer = allContainers.find(
    (c) => c.Image === 'exoframe/server:latest' && c.Names.find((n) => n.startsWith('/exoframe-server'))
  );
  // remove new server instance
  const srvInst = docker.getContainer(containerServer.Id);
  await srvInst.remove({ force: true });
  // if traefik hasn't been removed yet - remove it
  if (containerTraefik) {
    const trInst = docker.getContainer(containerTraefik.Id);
    await trInst.remove({ force: true });
  }
});
