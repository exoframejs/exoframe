import nock from 'nock';
import { setTimeout } from 'timers/promises';
import { afterAll, beforeEach, expect, test, vi } from 'vitest';
import { getUserConfig, resetUserConfig, setupMocks } from './util/config.js';

// setup mocks
const clearMocks = setupMocks();

// timeout for IO/net
const IO_TIMEOUT = 50;

// mock response data
const id = 'test-id';
const url = 'test.example.com';

let program;
beforeEach(async () => {
  // import component
  const { createProgram } = await import('../src/index.js');
  program = await createProgram();
});
afterAll(() => clearMocks());

test('Should remove by id', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const rmServer = nock('http://localhost:8080').post(`/remove/${id}`).reply(204);

  // execute logs
  await program.parseAsync(['remove', id], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(rmServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Removing deployment:",
        "test-id",
      ],
      [
        "Deployment removed!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  rmServer.done();
});

test('Should remove by url', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const rmServer = nock('http://localhost:8080').post(`/remove/${url}`).reply(204);

  // execute logs
  await program.parseAsync(['remove', url], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(rmServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Removing deployment:",
        "test.example.com",
      ],
      [
        "Deployment removed!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  rmServer.done();
});

test('Should remove by token instead of default auth', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const rmServer = nock('http://localhost:8080')
    .post(`/remove/${id}`)
    .matchHeader('Authorization', `Bearer test-token`)
    .reply(204);

  // execute logs
  await program.parseAsync(['remove', '--token', 'test-token', id], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(rmServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Removing deployment:",
        "test-id",
      ],
      [
        "
    Removing using given token..",
      ],
      [
        "Deployment removed!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  rmServer.done();
});

test('Should show remove error', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const rmServer = nock('http://localhost:8080').post(`/remove/${id}`).reply(500);

  // execute logs
  await program.parseAsync(['remove', id], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(rmServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Removing deployment:",
        "test-id",
      ],
      [
        "Error removing project:",
        "HTTPError: Request failed with status code 500 (Internal Server Error): POST http://localhost:8080/remove/test-id",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  rmServer.done();
});

test('Should show not found error', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const rmServer = nock('http://localhost:8080').post(`/remove/${id}`).reply(404);

  // execute logs
  await program.parseAsync(['remove', id], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(rmServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Removing deployment:",
        "test-id",
      ],
      [
        "Error: container or function was not found!",
        "Please, check deployment ID and try again.",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  rmServer.done();
});

test('Should show not found error on empty body', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const rmServer = nock('http://localhost:8080').post(`/remove/${id}`).reply(404);

  // execute logs
  await program.parseAsync(['remove', id], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(rmServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Removing deployment:",
        "test-id",
      ],
      [
        "Error: container or function was not found!",
        "Please, check deployment ID and try again.",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  rmServer.done();
});

test('Should deauth on 401', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const rmServer = nock('http://localhost:8080').post(`/remove/${id}`).reply(401);

  // execute logs
  await program.parseAsync(['remove', id], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(rmServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Removing deployment:",
        "test-id",
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
  rmServer.done();
  // reset config to original state
  resetUserConfig();
});
