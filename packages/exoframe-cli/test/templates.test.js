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

let program;
beforeEach(async () => {
  // import component
  const { createProgram } = await import('../src/index.js');
  program = await createProgram();
});
afterAll(() => clearMocks());

test('Should list templates', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct requests
  const templateServer = nock('http://localhost:8080')
    .get('/templates')
    .reply(200, { template: '^0.0.1', otherTemplate: '^1.0.0' });

  // execute logs
  program.parse(['template', 'ls'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(templateServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Listing deployment templates for:",
        "http://localhost:8080",
      ],
      [
        "2 templates found on http://localhost:8080:
    ",
      ],
      [
        "[31m   Template        [39m[90m [39m[31m   Version   [39m
       template        [90m [39m   ^0.0.1    
       otherTemplate   [90m [39m   ^1.0.0    ",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  templateServer.done();
});

test('Should list zero templates', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct requests
  const templateServer = nock('http://localhost:8080').get('/templates').reply(200, {});

  // execute logs
  program.parse(['template', 'ls'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(templateServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Listing deployment templates for:",
        "http://localhost:8080",
      ],
      [
        "No templates found on http://localhost:8080!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  templateServer.done();
});

test('Should install new template via interactive input', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct requests
  const templateServer = nock('http://localhost:8080')
    .post('/templates')
    .reply(200, {
      success: 'true',
      log: [
        { message: '1', level: 'info' },
        { message: '2', level: 'info' },
        { message: '3', level: 'error' },
      ],
    });

  // mock enquirer reply
  const enqSpy = vi.spyOn(inquirer, 'prompt').mockImplementationOnce(() => Promise.resolve({ templateName: 'test' }));

  // execute logs
  program.parse(['template', 'add'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(templateServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Adding new deployment template for:",
        "http://localhost:8080",
      ],
      [
        "Installing new template...",
      ],
      [
        "New template installed!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  enqSpy.mockReset();
  templateServer.done();
});

test('Should remove template via interactive input', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct requests
  const templateGetServer = nock('http://localhost:8080').get('/templates').reply(200, { testTemplate: '0.0.1' });
  // handle correct request
  const templateServer = nock('http://localhost:8080')
    .delete('/templates')
    .reply(200, {
      removed: true,
      log: [
        { message: '1', level: 'info' },
        { message: '2', level: 'info' },
        { message: '3', level: 'error' },
      ],
    });

  // mock enquirer reply
  const enqSpy = vi
    .spyOn(inquirer, 'prompt')
    .mockImplementationOnce(() => Promise.resolve({ templateName: 'testTemplate' }));

  // execute logs
  program.parse(['template', 'rm', '-v'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(templateGetServer.isDone()).toBeTruthy();
  expect(templateServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Removing deployment template for:",
        "http://localhost:8080",
      ],
      [
        "Removing deployment template...",
      ],
      [
        "Template successfully removed!",
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
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  enqSpy.mockReset();
  templateGetServer.done();
  templateServer.done();
});

test('Should show error and log during template removal', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const templateServer = nock('http://localhost:8080')
    .delete('/templates')
    .reply(200, {
      removed: false,
      log: [
        { message: '1', level: 'info' },
        { message: '2', level: 'info' },
        { message: '3', level: 'error' },
      ],
    });

  // execute logs
  program.parse(['template', 'rm', 'fail'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(templateServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Removing deployment template for:",
        "http://localhost:8080",
      ],
      [
        "Removing deployment template...",
      ],
      [
        "Error removing template!",
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
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  templateServer.done();
});

test('Should deauth on 401 on creation', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const templateServer = nock('http://localhost:8080').post('/templates').reply(401);

  // execute logs
  program.parse(['template', 'add', 'test'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(templateServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Adding new deployment template for:",
        "http://localhost:8080",
      ],
      [
        "Installing new template...",
      ],
      [
        "Template install failed!",
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
  templateServer.done();
  // reset config to original state
  await resetUserConfig();
});

// TODO: fixme after config reload is done on import, not on load
test.skip('Should deauth on 401 on list', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const templateServer = nock('http://localhost:8080').get('/templates').reply(401);

  // execute logs
  program.parse(['template', 'list'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(templateServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot();
  // make sure write was called
  const cfg = await getUserConfig();
  expect(cfg.user).toBeUndefined();
  expect(cfg.token).toBeUndefined();
  // restore mocks
  consoleSpy.mockRestore();
  templateServer.done();
  // reset config to original state
  await resetUserConfig();
});

// TODO: fixme after config reload is done on import, not on load
test.skip('Should deauth on 401 on removal', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const templateServer = nock('http://localhost:8080').delete('/templates').reply(401);

  // execute logs
  program.parse(['template', 'rm', 'deauth'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(templateServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot();
  // make sure write was called
  const cfg = await getUserConfig();
  expect(cfg.user).toBeUndefined();
  expect(cfg.token).toBeUndefined();
  // restore mocks
  consoleSpy.mockRestore();
  templateServer.done();
  // reset config to original state
  await resetUserConfig();
});
