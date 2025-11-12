import inquirer from 'inquirer';
import nock from 'nock';
import { setTimeout } from 'timers/promises';
import { afterAll, beforeEach, expect, test, vi } from 'vitest';
import { getUserConfig, resetUserConfig, setupMocks } from './util/config.js';

// setup mocks
const clearMocks = setupMocks();

// timeout for IO/net
const IO_TIMEOUT = 50;

// mock response data
const questions = [
  { type: 'input', name: 'test1', message: 'Test q1:' },
  { type: 'input', name: 'test2', message: 'Test q2:' },
];

let program;
beforeEach(async () => {
  // import component
  const { createProgram } = await import('../src/index.js');
  program = await createProgram();
});
afterAll(() => clearMocks());

test('Should execute setup via interactive input', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct requests
  const setupServerGet = nock('http://localhost:8080')
    .get('/setup')
    .query({ recipeName: 'test' })
    .reply(200, { success: 'true', questions, log: ['1', '2', '3'] });
  const setupServerPost = nock('http://localhost:8080')
    .post('/setup')
    .reply(200, {
      success: 'true',
      log: [
        { message: '1', level: 'info' },
        { message: '2', level: 'info' },
        { message: '3', level: 'debug' },
      ],
    });
  // stub inquirer answers
  const enqSpy = vi
    .spyOn(inquirer, 'prompt')
    .mockImplementationOnce(() => Promise.resolve({ givenRecipeName: 'test' }))
    .mockImplementationOnce(() => Promise.resolve({ test1: 'answer1', test2: 'answer2' }));

  // execute logs
  await program.parseAsync(['setup'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(setupServerGet.isDone()).toBeTruthy();
  expect(setupServerPost.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Setting new deployment using recipe at:",
        "http://localhost:8080",
      ],
      [
        "Installing new recipe...",
      ],
      [
        "New recipe installed! Preparing setup..",
      ],
      [
        "Executing recipe with user configuration...",
      ],
      [
        "",
      ],
      [
        "",
      ],
      [
        "1",
      ],
      [
        "2",
      ],
      [
        "",
      ],
      [
        "Recipe successfully executed!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  enqSpy.mockRestore();
  setupServerGet.done();
  setupServerPost.done();
});

test('Should execute setup via flags in verbose mode', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct requests
  const setupServerGet = nock('http://localhost:8080')
    .get('/setup')
    .query({ recipeName: 'test' })
    .reply(200, { success: 'true', questions, log: ['1', '2', '3'] });
  const setupServerPost = nock('http://localhost:8080')
    .post('/setup')
    .reply(200, {
      success: 'true',
      log: [
        { message: '1', level: 'info' },
        { message: '2', level: 'info' },
        { message: '3', level: 'debug' },
      ],
    });
  // stub inquirer answers
  const enqSpy = vi
    .spyOn(inquirer, 'prompt')
    .mockImplementationOnce(() => Promise.resolve({ test1: 'answer1', test2: 'answer2' }));

  // execute logs
  await program.parseAsync(['setup', '-v', 'test'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(setupServerGet.isDone()).toBeTruthy();
  expect(setupServerPost.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Setting new deployment using recipe at:",
        "http://localhost:8080",
      ],
      [
        "Installing new recipe...",
      ],
      [
        "New recipe installed! Preparing setup..",
      ],
      [
        "Executing recipe with user configuration...",
      ],
      [
        "",
      ],
      [
        "Log:",
      ],
      [
        "1",
      ],
      [
        "2",
      ],
      [
        "3",
      ],
      [
        "",
      ],
      [
        "Recipe successfully executed!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  enqSpy.mockRestore();
  setupServerGet.done();
  setupServerPost.done();
});

test('Should deauth on 401', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const setupServer = nock('http://localhost:8080').get('/setup').query({ recipeName: 'test' }).reply(401);

  // execute logs
  await program.parseAsync(['setup', 'test'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(setupServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Setting new deployment using recipe at:",
        "http://localhost:8080",
      ],
      [
        "Installing new recipe...",
      ],
      [
        "Recipe execution failed!",
      ],
      [
        "Error: authorization expired!",
        "Please, relogin and try again.",
      ],
    ]
  `);
  // make sure write was called
  const cfg = await getUserConfig();
  expect(cfg.user).toBeUndefined();
  expect(cfg.token).toBeUndefined();
  // restore mocks
  consoleSpy.mockRestore();
  setupServer.done();
  // reset config to original state
  resetUserConfig();
});
