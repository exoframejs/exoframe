import { readdirSync, writeFileSync } from 'fs';
import getPort from 'get-port';
import { mkdirp } from 'mkdirp';
import { join } from 'path';
import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { runNPM } from '../src/util/index.js';
import authToken from './fixtures/authToken.js';

// mock config
vi.mock('../src/config/index.js', () => import('./__mocks__/config.js'));

// import server after mocking config
const { startServer } = await import('../src/index.js');

// get recipes dir from config
const { recipesFolder } = await import('../src/config/index.js');

// container vars
let fastify;

// test recipe name
const testInstallRecipe = 'exoframe-recipe-wordpress';
const testRunRecipe = 'test-recipe';

beforeAll(async () => {
  // start server
  const port = await getPort();
  fastify = await startServer(port);
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
  expect(result.questions).toMatchInlineSnapshot(`
    [
      {
        "message": "Wordpress project name:",
        "name": "projectName",
        "type": "input",
      },
      {
        "message": "MySQL root password:",
        "name": "mysqlPassword",
        "type": "input",
      },
      {
        "message": "Domain for Wordpress:",
        "name": "wordpressDomain",
        "type": "input",
      },
      {
        "message": "Also start PHPMyAdmin?",
        "name": "phpmyadminStart",
        "type": "confirm",
      },
      {
        "message": "Domain for PHPMyAdmin:",
        "name": "phpmyadminDomain",
        "type": "input",
      },
    ]
  `);

  // check folder
  const files = readdirSync(join(recipesFolder, 'node_modules'));
  expect(files).toContain(testInstallRecipe);
});

test('Should execute recipe', async () => {
  // write test module to folder
  const folder = join(recipesFolder, 'node_modules', testRunRecipe);
  await mkdirp(folder);
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
  expect(result.log).toMatchInlineSnapshot(`
    [
      {
        "data": {
          "other": "2",
          "test": "1",
        },
        "level": "info",
        "message": "works!",
      },
    ]
  `);
});
