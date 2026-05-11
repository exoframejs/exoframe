import nock from 'nock';
import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import authToken from './fixtures/authToken.js';
import serverReleasesJSON from './fixtures/version/server-releases.json';
import traefikReleasesJSON from './fixtures/version/traefik-releases.json';

// mock config
vi.mock('../src/config/index.ts', () => import('./__mocks__/config.ts'));
vi.mock('../src/config/paths.ts', () => import('./__mocks__/config.ts'));

// import server after mocking config
const { startServer } = await import('../src/index.ts');

// setup github API mocking to evade rate limits in CI
nock('https://api.github.com/repos')
  .get('/exoframejs/exoframe/releases')
  .reply(200, serverReleasesJSON)
  .get('/containous/traefik/releases')
  .reply(200, traefikReleasesJSON);

// container vars
let fastify;

beforeAll(async () => {
  // start server
  fastify = await startServer(0);
});

afterAll(() => fastify?.close());

test('Should get current and latest versions', async () => {
  // options base
  const options = {
    method: 'GET',
    url: '/version',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  };

  const response = await fastify.inject(options);
  const result = JSON.parse(response.payload);

  // check response
  expect(response.statusCode).toEqual(200);
  expect(result.server).toBeDefined();
  expect(result.traefik).toBeDefined();
  expect(result.latestServer).toBeDefined();
  expect(result.latestTraefik).toBeDefined();
});
