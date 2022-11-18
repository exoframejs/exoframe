import inquirer from 'inquirer';
import nock from 'nock';
import { setTimeout } from 'timers/promises';
import { afterAll, beforeEach, expect, test, vi } from 'vitest';
import { getUserConfig, resetUserConfig, setupMocks } from './util/config.js';

// setup mocks
const clearMocks = setupMocks();

// timeout for IO/net
const IO_TIMEOUT = 50;

let program;
beforeEach(async () => {
  // import component
  const { createProgram } = await import('../src/index.js');
  program = await createProgram();
});
afterAll(() => clearMocks());

test('Should list tokens', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // generate date for test
  const createDate = new Date(2017, 1, 1, 1, 1, 1, 1);
  // handle correct request
  const tokenServer = nock('http://localhost:8080')
    .get('/deployToken')
    .reply(200, { tokens: [{ tokenName: 'test', meta: { created: createDate } }] });

  // execute logs
  program.parse(['token', 'ls'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(tokenServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Listing deployment tokens for:",
        "http://localhost:8080",
      ],
      [
        "Got generated tokens:",
      ],
      [
        "",
      ],
      [
        "  > test [2/1/2017, 1:01:01 AM]",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  tokenServer.done();
});

test('Should list zero tokens', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const tokenServer = nock('http://localhost:8080').get('/deployToken').reply(200, { tokens: [] });

  // execute logs
  program.parse(['token', 'ls'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(tokenServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Listing deployment tokens for:",
        "http://localhost:8080",
      ],
      [
        "Got generated tokens:",
      ],
      [
        "",
      ],
      [
        "  > No deployment tokens available!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  tokenServer.done();
});

test('Should generate new token via interactive input', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const tokenServer = nock('http://localhost:8080').post('/deployToken').reply(200, { name: 'test', value: 'val' });

  // mock enquirer reply
  const enqSpy = vi.spyOn(inquirer, 'prompt').mockImplementationOnce(() => Promise.resolve({ tokenName: 'test' }));

  // execute logs
  program.parse(['token', 'add'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(tokenServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Adding new deployment token for:",
        "http://localhost:8080",
      ],
      [
        "Generating new deployment token...",
      ],
      [
        "New token generated:",
      ],
      [
        "",
      ],
      [
        " > Name: test",
      ],
      [
        " > Value: val",
      ],
      [
        "",
      ],
      [
        "WARNING!",
        "Make sure to write it down, you will not be able to get it's value again!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  enqSpy.mockReset();
  tokenServer.done();
});

test('Should generate new token via flags', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const tokenServer = nock('http://localhost:8080').post('/deployToken').reply(200, { name: 'test', value: 'val' });

  // execute logs
  program.parse(['token', 'add', 'test'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(tokenServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Adding new deployment token for:",
        "http://localhost:8080",
      ],
      [
        "Generating new deployment token...",
      ],
      [
        "New token generated:",
      ],
      [
        "",
      ],
      [
        " > Name: test",
      ],
      [
        " > Value: val",
      ],
      [
        "",
      ],
      [
        "WARNING!",
        "Make sure to write it down, you will not be able to get it's value again!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  tokenServer.done();
});

test('Should remove token via interactive input', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // generate date for test
  const createDate = new Date(2017, 1, 1, 1, 1, 1, 1);
  // handle correct request
  const tokenGetServer = nock('http://localhost:8080')
    .get('/deployToken')
    .reply(200, { tokens: [{ tokenName: 'test', meta: { created: createDate } }] });
  // handle correct request
  const tokenServer = nock('http://localhost:8080').delete('/deployToken').reply(204, '');

  // mock enquirer reply
  const enqSpy = vi.spyOn(inquirer, 'prompt').mockImplementationOnce(() => Promise.resolve({ tokenName: 'test' }));

  // execute logs
  program.parse(['token', 'rm'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(tokenGetServer.isDone()).toBeTruthy();
  expect(tokenServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Removing deployment token for:",
        "http://localhost:8080",
      ],
      [
        "Removing deployment token...",
      ],
      [
        "Token successfully removed!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  enqSpy.mockReset();
  tokenGetServer.done();
  tokenServer.done();
});

test('Should remove token via flags', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const tokenServer = nock('http://localhost:8080').delete('/deployToken').reply(204, '');

  // execute logs
  program.parse(['token', 'rm', 'test'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(tokenServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Removing deployment token for:",
        "http://localhost:8080",
      ],
      [
        "Removing deployment token...",
      ],
      [
        "Token successfully removed!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  tokenServer.done();
});

test('Should deauth on 401 on creation', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const tokenServer = nock('http://localhost:8080').post('/deployToken').reply(401);

  // execute logs
  program.parse(['token', 'add', 'test'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(tokenServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Adding new deployment token for:",
        "http://localhost:8080",
      ],
      [
        "Generating new deployment token...",
      ],
      [
        "Generating deployment token failed!",
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
  tokenServer.done();
  // reset config to original state
  await resetUserConfig();
});

// TODO: fixme after config loading is refactored
test.skip('Should deauth on 401 on list', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const tokenServer = nock('http://localhost:8080').get('/deployToken').reply(401);

  // execute logs
  program.parse(['token', 'ls'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(tokenServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Listing deployment tokens for:",
        "http://localhost:8080",
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
  tokenServer.done();
  // reset config to original state
  await resetUserConfig();
});

// TODO: fixme
test.skip('Should deauth on 401 on removal', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const tokenServer = nock('http://localhost:8080').delete('/deployToken').reply(401);

  // execute logs
  program.parse(['token', 'rm', 'test'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(tokenServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot();
  // make sure write was called
  const cfg = await getUserConfig();
  expect(cfg.user).toBeUndefined();
  expect(cfg.token).toBeUndefined();
  // restore mocks
  consoleSpy.mockRestore();
  tokenServer.done();
  // reset config to original state
  await resetUserConfig();
});
