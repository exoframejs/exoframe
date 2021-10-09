import { afterAll, beforeAll, expect, jest, test } from '@jest/globals';
import getPort from 'get-port';
import nock from 'nock';
import authToken from './fixtures/authToken.js';
import serverReleasesJSON from './fixtures/version/server-releases.json';
import traefikReleasesJSON from './fixtures/version/traefik-releases.json';

// mock config
jest.unstable_mockModule('../src/config/index.js', () => import('./__mocks__/config.js'));

// import server after mocking config
const { startServer } = await import('../src/index.js');

// setup github API mocking to evade rate limits in CI
nock('https://api.github.com/repos')
  .get('/exoframejs/exoframe-server/releases')
  .reply(200, serverReleasesJSON)
  .get('/containous/traefik/releases')
  .reply(200, traefikReleasesJSON);

// container vars
let fastify;

// set timeout to 60s
jest.setTimeout(60000);

beforeAll(async () => {
  // start server
  const port = await getPort();
  fastify = await startServer(port);
  return fastify;
});

afterAll(() => fastify.close());

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
