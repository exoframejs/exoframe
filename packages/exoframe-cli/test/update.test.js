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

test('Should update traefik via flags', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle request for updates
  const response = {
    server: '0.18.0',
    latestServer: '0.19.1',
    serverUpdate: true,
    traefik: 'v1.3.0',
    latestTraefik: 'v1.3.2',
    traefikUpdate: true,
  };
  const updateStatusServer = nock('http://localhost:8080').get('/version').reply(200, response);
  // handle correct request
  const updateServer = nock('http://localhost:8080').post('/update/traefik').reply(200, { updated: true });

  // execute logs
  program.parse(['update', 'traefik'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(updateStatusServer.isDone()).toBeTruthy();
  expect(updateServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Checking for updates...",
      ],
      [
        "Updates available!",
      ],
      [],
      [
        "Exoframe Server:",
      ],
      [
        "  current: 0.18.0",
      ],
      [
        "  latest: 0.19.1",
      ],
      [],
      [
        "Traefik:",
      ],
      [
        "  current: v1.3.0",
      ],
      [
        "  latest: v1.3.2",
      ],
      [],
      [
        "Updating traefik...",
      ],
      [
        "Traefik updated!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  updateStatusServer.done();
  updateServer.done();
});

test('Should update exoframe via flags', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle request for updates
  const response = {
    server: '0.18.0',
    latestServer: '0.19.1',
    serverUpdate: true,
    traefik: 'v1.3.0',
    latestTraefik: 'v1.3.2',
    traefikUpdate: true,
  };
  const updateStatusServer = nock('http://localhost:8080').get('/version').reply(200, response);
  // handle correct request
  const updateServer = nock('http://localhost:8080').post('/update/server').reply(200, { updated: true });

  // execute logs
  program.parse(['update', 'server'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(updateStatusServer.isDone()).toBeTruthy();
  expect(updateServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Checking for updates...",
      ],
      [
        "Updates available!",
      ],
      [],
      [
        "Exoframe Server:",
      ],
      [
        "  current: 0.18.0",
      ],
      [
        "  latest: 0.19.1",
      ],
      [],
      [
        "Traefik:",
      ],
      [
        "  current: v1.3.0",
      ],
      [
        "  latest: v1.3.2",
      ],
      [],
      [
        "Updating exoframe server...",
      ],
      [
        "Exoframe server updated!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  updateStatusServer.done();
  updateServer.done();
});

test('Should update all via flags', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle request for updates
  const response = {
    server: '0.18.0',
    latestServer: '0.19.1',
    serverUpdate: true,
    traefik: 'v1.3.0',
    latestTraefik: 'v1.3.2',
    traefikUpdate: true,
  };
  const updateStatusServer = nock('http://localhost:8080').get('/version').reply(200, response);
  // handle correct request
  const updateTraefikServer = nock('http://localhost:8080').post('/update/traefik').reply(200, { updated: true });
  const updateExoServer = nock('http://localhost:8080').post('/update/server').reply(200, { updated: true });

  // execute logs
  program.parse(['update', 'all'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(updateStatusServer.isDone()).toBeTruthy();
  expect(updateTraefikServer.isDone()).toBeTruthy();
  expect(updateExoServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Checking for updates...",
      ],
      [
        "Updates available!",
      ],
      [],
      [
        "Exoframe Server:",
      ],
      [
        "  current: 0.18.0",
      ],
      [
        "  latest: 0.19.1",
      ],
      [],
      [
        "Traefik:",
      ],
      [
        "  current: v1.3.0",
      ],
      [
        "  latest: v1.3.2",
      ],
      [],
      [
        "Updating all services...",
      ],
      [
        "All services updated!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  updateStatusServer.done();
  updateTraefikServer.done();
  updateExoServer.done();
});

test('Should update all interactively', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle request for updates
  const response = {
    server: '0.18.0',
    latestServer: '0.19.1',
    serverUpdate: true,
    traefik: 'v1.3.0',
    latestTraefik: 'v1.3.2',
    traefikUpdate: true,
  };
  const updateStatusServer = nock('http://localhost:8080').get('/version').reply(200, response);
  // handle correct request
  const updateTraefikServer = nock('http://localhost:8080').post('/update/traefik').reply(200, { updated: true });
  const updateExoServer = nock('http://localhost:8080').post('/update/server').reply(200, { updated: true });

  // mock enquirer reply
  const enqSpy = vi
    .spyOn(inquirer, 'prompt')
    .mockImplementationOnce(() => Promise.resolve({ upServer: true, upTraefik: true }));

  // execute logs
  program.parse(['update'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(updateStatusServer.isDone()).toBeTruthy();
  expect(updateTraefikServer.isDone()).toBeTruthy();
  expect(updateExoServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Checking for updates...",
      ],
      [
        "Updates available!",
      ],
      [],
      [
        "Exoframe Server:",
      ],
      [
        "  current: 0.18.0",
      ],
      [
        "  latest: 0.19.1",
      ],
      [],
      [
        "Traefik:",
      ],
      [
        "  current: v1.3.0",
      ],
      [
        "  latest: v1.3.2",
      ],
      [],
      [
        "Updating all services...",
      ],
      [
        "All services updated!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  enqSpy.mockReset();
  updateStatusServer.done();
  updateTraefikServer.done();
  updateExoServer.done();
});

test('Should update exoframe interactively', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle request for updates
  const response = {
    server: '0.18.0',
    latestServer: '0.19.1',
    serverUpdate: true,
    traefik: 'v1.3.0',
    latestTraefik: 'v1.3.2',
    traefikUpdate: true,
  };
  const updateStatusServer = nock('http://localhost:8080').get('/version').reply(200, response);
  // handle correct request
  const updateExoServer = nock('http://localhost:8080').post('/update/server').reply(200, { updated: true });

  // mock enquirer reply
  const enqSpy = vi
    .spyOn(inquirer, 'prompt')
    .mockImplementationOnce(() => Promise.resolve({ upServer: true, upTraefik: false }));

  // execute logs
  program.parse(['update'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(updateStatusServer.isDone()).toBeTruthy();
  expect(updateExoServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Checking for updates...",
      ],
      [
        "Updates available!",
      ],
      [],
      [
        "Exoframe Server:",
      ],
      [
        "  current: 0.18.0",
      ],
      [
        "  latest: 0.19.1",
      ],
      [],
      [
        "Traefik:",
      ],
      [
        "  current: v1.3.0",
      ],
      [
        "  latest: v1.3.2",
      ],
      [],
      [
        "Updating exoframe server...",
      ],
      [
        "Exoframe server updated!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  enqSpy.mockReset();
  updateStatusServer.done();
  updateExoServer.done();
});

test('Should update traefik interactively', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle request for updates
  const response = {
    server: '0.18.0',
    latestServer: '0.19.1',
    serverUpdate: true,
    traefik: 'v1.3.0',
    latestTraefik: 'v1.3.2',
    traefikUpdate: true,
  };
  const updateStatusServer = nock('http://localhost:8080').get('/version').reply(200, response);
  // handle correct request
  const updateTraefikServer = nock('http://localhost:8080').post('/update/traefik').reply(200, { updated: true });

  // mock enquirer reply
  const enqSpy = vi
    .spyOn(inquirer, 'prompt')
    .mockImplementationOnce(() => Promise.resolve({ upServer: false, upTraefik: true }));

  // execute logs
  program.parse(['update'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(updateStatusServer.isDone()).toBeTruthy();
  expect(updateTraefikServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Checking for updates...",
      ],
      [
        "Updates available!",
      ],
      [],
      [
        "Exoframe Server:",
      ],
      [
        "  current: 0.18.0",
      ],
      [
        "  latest: 0.19.1",
      ],
      [],
      [
        "Traefik:",
      ],
      [
        "  current: v1.3.0",
      ],
      [
        "  latest: v1.3.2",
      ],
      [],
      [
        "Updating traefik...",
      ],
      [
        "Traefik updated!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  enqSpy.mockReset();
  updateStatusServer.done();
  updateTraefikServer.done();
});

test('Should update none interactively', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle request for updates
  const response = {
    server: '0.18.0',
    latestServer: '0.19.1',
    serverUpdate: true,
    traefik: 'v1.3.0',
    latestTraefik: 'v1.3.2',
    traefikUpdate: true,
  };
  const updateStatusServer = nock('http://localhost:8080').get('/version').reply(200, response);

  // mock enquirer reply
  const enqSpy = vi
    .spyOn(inquirer, 'prompt')
    .mockImplementationOnce(() => Promise.resolve({ upServer: false, upTraefik: false }));

  // execute logs
  program.parse(['update'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(updateStatusServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Checking for updates...",
      ],
      [
        "Updates available!",
      ],
      [],
      [
        "Exoframe Server:",
      ],
      [
        "  current: 0.18.0",
      ],
      [
        "  latest: 0.19.1",
      ],
      [],
      [
        "Traefik:",
      ],
      [
        "  current: v1.3.0",
      ],
      [
        "  latest: v1.3.2",
      ],
      [],
      [
        "Nothing selected for update, exiting...",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  enqSpy.mockReset();
  updateStatusServer.done();
});

test('Should not update if at latest version', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle request for updates
  const response = {
    server: '0.19.1',
    latestServer: '0.19.1',
    serverUpdate: false,
    traefik: 'v1.3.2',
    latestTraefik: 'v1.3.2',
    traefikUpdate: false,
  };
  const updateStatusServer = nock('http://localhost:8080').get('/version').reply(200, response);

  // execute logs
  program.parse(['update'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(updateStatusServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Checking for updates...",
      ],
      [
        "You are up to date!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  updateStatusServer.done();
});

test('Should deauth on 401', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle request for updates
  const updateStatusServer = nock('http://localhost:8080').get('/version').reply(401);

  // execute logs
  program.parse(['update'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(updateStatusServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Checking for updates...",
      ],
      [
        "Update failed!",
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
  updateStatusServer.done();
  // reset config to original state
  await resetUserConfig();
});
