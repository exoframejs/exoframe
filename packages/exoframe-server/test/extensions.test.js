import { afterAll, beforeAll, expect, jest, test } from '@jest/globals';
import { readdirSync } from 'fs';
import getPort from 'get-port';
import { join } from 'path';
import authToken from './fixtures/authToken.js';

// mock config
jest.unstable_mockModule('../src/config/index.js', () => import('./__mocks__/config.js'));

// import server after mocking config
const { startServer } = await import('../src/index.js');

// get extensions folder from config
const { extensionsFolder } = await import('../src/config/index.js');

// container vars
let fastify;

// test template name
const testTemplate = 'exoframe-template-java';

// set timeout to 60s
jest.setTimeout(60000);

beforeAll(async () => {
  // start server
  const port = await getPort();
  fastify = await startServer(port);
  return fastify;
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
