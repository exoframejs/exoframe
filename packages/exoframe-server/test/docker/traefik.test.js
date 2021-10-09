import { afterAll, beforeAll, describe, expect, jest, test } from '@jest/globals';
import getPort from 'get-port';
import docker from '../../src/docker/docker.js';
import { initNetwork } from '../../src/docker/network.js';
import { initTraefik } from '../../src/docker/traefik.js';

// mock config
jest.unstable_mockModule('../../src/config/index.js', () => import('../__mocks__/config.js'));
const cfg = await import('../../src/config/index.js');

// our packages
const { startServer } = await import('../../src/index.js');

// container vars
let fastify;
let config;

// set timeout to 60s because we need to pull stuff
jest.setTimeout(60000);

beforeAll(async () => {
  // start server
  const port = await getPort();
  fastify = await startServer(port);

  // get config
  await cfg.waitForConfig();
  config = cfg.getConfig();

  return fastify;
});

afterAll(() => fastify.close());

describe('Traefik', () => {
  let exoNet;
  let container;

  beforeAll(async () => {
    // create exoframe network if needed
    exoNet = await initNetwork();

    // run traefik init
    await initTraefik(exoNet);

    // get traefik container
    const allContainers = await docker.listContainers();
    container = allContainers.find((c) => c.Names.find((n) => n === `/${config.traefikName}`));
  });

  test('Should start traefik container', () => {
    expect(container).toBeDefined();
    expect(container.State).toBe('running');
  });

  test('Should attach traefik to network', () => {
    expect(container.NetworkSettings.Networks.exoframe).toBeDefined();
  });

  test('Should open traefik ports', () => {
    expect(container.Ports.length).toEqual(4);
    expect(container.Ports.find((p) => p.PrivatePort === 443)).toBeTruthy();
    expect(container.Ports.find((p) => p.PublicPort === 443)).toBeTruthy();
    expect(container.Ports.find((p) => p.PrivatePort === 80)).toBeTruthy();
    expect(container.Ports.find((p) => p.PublicPort === 80)).toBeTruthy();
  });

  test('Should mount config folder to traefik', () => {
    expect(container.Mounts.find((m) => m.Destination === '/var/run/docker.sock')).toBeTruthy();
    expect(container.Mounts.find((m) => m.Destination === '/var/traefik')).toBeTruthy();
  });
});
