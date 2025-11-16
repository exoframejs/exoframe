import { readdirSync } from 'fs';
import getPort from 'get-port';
import { join } from 'path';
import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import authToken from './fixtures/authToken.js';

// mock config
vi.mock('../src/config/index.js', () => import('./__mocks__/config.js'));
vi.mock('../src/config/paths.js', () => import('./__mocks__/config.js'));

// import server after mocking config
const { startServer } = await import('../src/index.js');

// get extensions folder from config paths
const { extensionsFolder } = await import('../src/config/paths.js');

// container vars
let fastify;

// test template name
const testTemplate = 'exoframe-template-java';

beforeAll(async () => {
  // start server
  const port = await getPort();
  fastify = await startServer(port);
});

afterAll(() => fastify.close());

test('Should install new template', async () => {
  // options base
  const options = {
    method: 'POST',
    url: '/templates',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    payload: {
      templateName: testTemplate,
    },
  };

  const response = await fastify.inject(options);
  const result = JSON.parse(response.payload);

  // check answer
  expect(response.statusCode).toEqual(200);
  expect(result.success).toBeTruthy();
  expect(result.log.length).toBeGreaterThan(0);

  // check folder
  const files = readdirSync(join(extensionsFolder, 'node_modules'));
  expect(files).toContain(testTemplate);
});

test('Should get list of installed templates', async () => {
  // options base
  const options = {
    method: 'GET',
    url: '/templates',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  };

  const response = await fastify.inject(options);
  const result = JSON.parse(response.payload);

  // check response
  expect(response.statusCode).toEqual(200);
  expect(Object.keys(result)).toEqual([testTemplate]);
});

test('Should remove existing template', async () => {
  // options base
  const options = {
    method: 'DELETE',
    url: '/templates',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    payload: {
      templateName: testTemplate,
    },
  };

  const response = await fastify.inject(options);
  const result = JSON.parse(response.payload);

  // check response
  expect(response.statusCode).toEqual(200);
  expect(result.removed).toBeTruthy();
  expect(result.log.length).toBeGreaterThan(0);

  // check folder
  const files = readdirSync(join(extensionsFolder, 'node_modules'));
  expect(files).not.toContain(testTemplate);
});
