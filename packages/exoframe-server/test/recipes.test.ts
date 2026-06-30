import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { mkdirp } from 'mkdirp';
import { join } from 'path';
import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { runNPM } from '../src/util/index.ts';
import authToken from './fixtures/authToken.js';

// mock config
vi.mock('../src/config/index.ts', () => import('./__mocks__/config.ts'));
vi.mock('../src/config/paths.ts', () => import('./__mocks__/config.ts'));

// import server after mocking config
const { startServer } = await import('../src/index.ts');

// get recipes dir from config paths
const { recipesFolder } = await import('../src/config/paths.ts');

// container vars
let fastify;

// test recipe name
const testInstallRecipe = 'exoframe-recipe-wordpress';

// recipes fixture package.json path and its original contents,
// so we can restore it after npm mutates it during install/remove
const recipesPackageJsonPath = join(recipesFolder, 'package.json');
const recipesPackageJson = readFileSync(recipesPackageJsonPath);
const testRunRecipe = 'test-recipe';

beforeAll(async () => {
  // start server
  fastify = await startServer(0);
});

afterAll(async () => {
  await fastify?.close();
  await runNPM({ args: ['remove', '--verbose', testInstallRecipe], cwd: recipesFolder });
  // restore the tracked fixture so npm install/remove does not leave the tree dirty
  writeFileSync(recipesPackageJsonPath, recipesPackageJson);
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
