import { readdirSync } from 'fs';
import { join } from 'path';
import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import authToken from './fixtures/authToken.js';

// mock config
vi.mock('../src/config/index.ts', () => import('./__mocks__/config.ts'));
vi.mock('../src/config/paths.ts', () => import('./__mocks__/config.ts'));

// import server after mocking config
const { startServer } = await import('../src/index.ts');

// get extensions folder from config paths
const { extensionsFolder } = await import('../src/config/paths.ts');

// container vars
let fastify;

// test template name
const testTemplate = 'exoframe-template-java';

beforeAll(async () => {
  // start server
  fastify = await startServer(0);
});

afterAll(() => fastify?.close());

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
