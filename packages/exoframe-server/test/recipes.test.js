import { afterAll, beforeAll, expect, jest, test } from '@jest/globals';
import { readdirSync, writeFileSync } from 'fs';
import getPort from 'get-port';
import mkdirp from 'mkdirp';
import { join } from 'path';
import { recipesFolder } from '../src/config/index.js';
import { startServer } from '../src/index.js';
import { runNPM } from '../src/util/index.js';
import authToken from './fixtures/authToken.js';

// mock config
jest.unstable_mockModule('../src/config/index.js', () => import('./__mocks__/config.js'));

// container vars
let fastify;

// test recipe name
const testInstallRecipe = 'exoframe-recipe-wordpress';
const testRunRecipe = 'test-recipe';

// set timeout to 60s
jest.setTimeout(60000);

beforeAll(async () => {
  // start server
  const port = await getPort();
  fastify = await startServer(port);
  return fastify;
});

afterAll(() => {
  fastify.close();
  runNPM({ args: ['remove', '--verbose', testInstallRecipe], cwd: recipesFolder });
});

test('Should install new recipe and return list of questions', async () => {
  // options base
  const options = {
    method: 'GET',
    url: `/setup?recipeName=${testInstallRecipe}`,
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  };

  const response = await fastify.inject(options);
  const result = JSON.parse(response.payload);

  // check answer
  expect(response.statusCode).toEqual(200);
  expect(result.success).toBeTruthy();
  expect(result.log.length).toBeGreaterThan(0);
  expect(result.questions).toMatchSnapshot();

  // check folder
  const files = readdirSync(join(recipesFolder, 'node_modules'));
  expect(files).toContain(testInstallRecipe);
});

test('Should execute recipe', async () => {
  // write test module to folder
  const folder = join(recipesFolder, 'node_modules', testRunRecipe);
  mkdirp.sync(folder);
  writeFileSync(
    join(folder, 'index.js'),
    `exports.runSetup = async ({answers}) => {
  return [{message: 'works!', data: answers, level: 'info'}];
  };`
  );

  const answers = {
    test: '1',
    other: '2',
  };

  // options base
  const options = {
    method: 'POST',
    url: '/setup',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    payload: {
      recipeName: testRunRecipe,
      answers,
    },
  };

  const response = await fastify.inject(options);
  const result = JSON.parse(response.payload);

  // check answer
  expect(response.statusCode).toEqual(200);
  expect(result.success).toBeTruthy();
  expect(result.log.length).toBeGreaterThan(0);
  expect(result.log).toMatchSnapshot();
});
