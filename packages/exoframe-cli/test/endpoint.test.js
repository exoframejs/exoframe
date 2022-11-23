import inquirer from 'inquirer';
import { setTimeout } from 'timers/promises';
import { afterAll, beforeEach, expect, test, vi } from 'vitest';
import { getUserConfig, setupMocks } from './util/config.js';

const mockEndpoint = 'http://test.endpoint';
const mockEndpoint2 = 'http://test';

// setup mocks
const clearMocks = setupMocks(false);

// get current user config
const origCfg = await getUserConfig();

// timeout for IO/net
const IO_TIMEOUT = 50;

let program;
beforeEach(async () => {
  // import component
  const { createProgram } = await import('../src/index.js');
  program = await createProgram();
});
afterAll(() => clearMocks());

// test config generation
test('Should add new endpoint', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // execute addition
  program.parse(['endpoint', 'add', mockEndpoint], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Updating endpoint URL to:",
        "http://test.endpoint",
      ],
      [
        "Endpoint URL updated!",
      ],
    ]
  `);

  // then check config changes
  const cfg = await getUserConfig();
  expect(cfg.endpoint).toEqual(mockEndpoint);
  expect(cfg.user).toBeUndefined();
  expect(cfg.token).toBeUndefined();
  expect(cfg.endpoints.length).toEqual(1);
  expect(cfg.endpoints[0].endpoint).toEqual(origCfg.endpoint);

  // clear
  consoleSpy.mockRestore();
});

// test config generation
test('Should add second new endpoint', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // execute addition
  program.parse(['endpoint', 'add', mockEndpoint2], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Updating endpoint URL to:",
        "http://test",
      ],
      [
        "Endpoint URL updated!",
      ],
    ]
  `);

  // then check config changes
  const cfg = await getUserConfig();
  expect(cfg.endpoint).toEqual(mockEndpoint2);
  expect(cfg.user).toBeUndefined();
  expect(cfg.token).toBeUndefined();
  expect(cfg.endpoints.length).toEqual(2);
  expect(cfg.endpoints[0].endpoint).toEqual(origCfg.endpoint);
  expect(cfg.endpoints[0].user).toBeUndefined();
  expect(cfg.endpoints[0].token).toBeUndefined();
  expect(cfg.endpoints[1].endpoint).toEqual(mockEndpoint);
  expect(cfg.endpoints[1].user).toBeUndefined();
  expect(cfg.endpoints[1].token).toBeUndefined();

  // restore console
  consoleSpy.mockRestore();
});

// test config generation
test('Should select old endpoint', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // mock enquirer reply
  const enqSpy = vi
    .spyOn(inquirer, 'prompt')
    .mockImplementationOnce(() => Promise.resolve({ newEndpoint: origCfg.endpoint }));

  // execute switch
  program.parse(['endpoint'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Updating endpoint URL to:",
        "http://localhost:8080",
      ],
      [
        "Endpoint URL updated!",
      ],
    ]
  `);

  // then check config changes
  const cfg = await getUserConfig();
  expect(cfg.endpoint).toEqual(origCfg.endpoint);
  expect(cfg.user).toBeUndefined();
  expect(cfg.token).toBeUndefined();
  expect(cfg.endpoints.length).toEqual(2);
  expect(cfg.endpoints[0].endpoint).toEqual(mockEndpoint);
  expect(cfg.endpoints[0].user).toBeUndefined();
  expect(cfg.endpoints[0].token).toBeUndefined();
  expect(cfg.endpoints[1].endpoint).toEqual(mockEndpoint2);
  expect(cfg.endpoints[1].user).toBeUndefined();
  expect(cfg.endpoints[1].token).toBeUndefined();

  // restore spies
  consoleSpy.mockRestore();
  enqSpy.mockRestore();
});

// test config generation
test('Should select old endpoint using URL param', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // execute switch
  program.parse(['endpoint', mockEndpoint], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Updating endpoint URL to:",
        "http://test.endpoint",
      ],
      [
        "Endpoint URL updated!",
      ],
    ]
  `);

  // then check config changes
  const cfg = await getUserConfig();
  expect(cfg.endpoint).toEqual(mockEndpoint);
  expect(cfg.user).toBeUndefined();
  expect(cfg.token).toBeUndefined();
  expect(cfg.endpoints.length).toEqual(2);
  expect(cfg.endpoints[0].endpoint).toEqual(mockEndpoint2);
  expect(cfg.endpoints[0].user).toBeUndefined();
  expect(cfg.endpoints[0].token).toBeUndefined();
  expect(cfg.endpoints[1].endpoint).toEqual(origCfg.endpoint);
  expect(cfg.endpoints[1].user).toBeUndefined();
  expect(cfg.endpoints[1].token).toBeUndefined();

  // restore console
  consoleSpy.mockRestore();
});

test('Should show error on remove of non-existent endpoint', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // execute switch
  program.parse(['endpoint', 'rm', 'do-not-exist'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Error!",
        "Couldn't find endpoint with URL:",
        "do-not-exist",
      ],
    ]
  `);

  // restore spies
  consoleSpy.mockRestore();
});

test('Should remove current endpoint using enquirer', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // mock enquirer reply
  const enqSpy = vi
    .spyOn(inquirer, 'prompt')
    .mockImplementationOnce(() => Promise.resolve({ delEndpoint: mockEndpoint }));

  // execute switch
  program.parse(['endpoint', 'rm'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Removing endpoint:",
        "http://test.endpoint",
      ],
      [
        "Endpoint removed!",
      ],
    ]
  `);

  // then check config changes
  const cfg = await getUserConfig();
  expect(cfg.endpoint).toEqual(mockEndpoint2);
  expect(cfg.user).toBeUndefined();
  expect(cfg.token).toBeUndefined();
  expect(cfg.endpoints.length).toEqual(1);
  expect(cfg.endpoints[0].endpoint).toEqual(origCfg.endpoint);
  expect(cfg.endpoints[0].user).toBeUndefined();
  expect(cfg.endpoints[0].token).toBeUndefined();

  // restore spies
  consoleSpy.mockRestore();
  enqSpy.mockRestore();
});

test('Should remove existing endpoint using param', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // execute switch
  program.parse(['endpoint', 'rm', origCfg.endpoint], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Removing endpoint:",
        "http://localhost:8080",
      ],
      [
        "Endpoint removed!",
      ],
    ]
  `);

  // then check config changes
  const cfg = await getUserConfig();
  expect(cfg.endpoint).toEqual(mockEndpoint2);
  expect(cfg.user).toBeUndefined();
  expect(cfg.token).toBeUndefined();
  expect(cfg.endpoints.length).toEqual(0);

  // restore spies
  consoleSpy.mockRestore();
});

test('Should not remove only endpoint', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // execute switch
  program.parse(['endpoint', 'rm', mockEndpoint2], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Error!",
        "Cannot remove the only endpoint URL:",
        "http://test",
      ],
    ]
  `);

  // then check config changes
  const cfg = await getUserConfig();
  expect(cfg.endpoint).toEqual(mockEndpoint2);
  expect(cfg.user).toBeUndefined();
  expect(cfg.token).toBeUndefined();
  expect(cfg.endpoints.length).toEqual(0);

  // restore spies
  consoleSpy.mockRestore();
});
