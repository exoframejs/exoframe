import nock from 'nock';
import { setTimeout } from 'timers/promises';
import { afterAll, beforeEach, expect, test, vi } from 'vitest';
import { getUserConfig, resetUserConfig, setupMocks } from './util/config.js';

// setup mocks
const clearMocks = setupMocks();

// timeout for IO/net
const IO_TIMEOUT = 50;

// mock response data
const containers = [
  {
    Id: '123',
    Name: '/test',
    Config: {
      Labels: {
        'traefik.http.routers.test.rule': 'Host(`test.host`)',
        'exoframe.deployment': 'test',
        'exoframe.project': 'test',
      },
    },
    State: {
      Status: 'Up 10 minutes',
    },
    NetworkSettings: {
      Networks: {
        exoframe: {
          Aliases: null,
        },
      },
    },
  },
  {
    Id: '321',
    Name: '/test2',
    Config: {
      Labels: { 'exoframe.project': 'test' },
    },
    State: {
      Status: 'Up 12 minutes',
    },
    NetworkSettings: {
      Networks: {
        exoframe: {
          Aliases: null,
        },
      },
    },
  },
  {
    Id: '111',
    Name: '/test3',
    Config: {
      Labels: { 'exoframe.project': 'other' },
    },
    State: {
      Status: 'Up 13 minutes',
    },
    NetworkSettings: {
      Networks: {
        exoframe: {
          Aliases: null,
        },
      },
    },
  },
  {
    Id: '444',
    Name: '/test4',
    Config: {
      Labels: { 'exoframe.project': 'somethingelse' },
    },
    State: {
      Status: 'Up 10 minutes',
    },
    NetworkSettings: {
      Networks: {
        default: {
          Aliases: null,
        },
        traefik: {
          Aliases: ['alias4'],
        },
      },
    },
  },
];

let program;
beforeEach(async () => {
  // import component
  const { createProgram } = await import('../src/index.js');
  program = await createProgram();
});
afterAll(() => clearMocks());

// test list
test('Should get list of deployments', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const listServer = nock('http://localhost:8080').get(`/list`).reply(200, { containers });

  // execute list
  program.parse(['list'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(listServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "4 deployments found on http://localhost:8080:
    ",
      ],
      [
        "> Normal deployments:
    ",
      ],
      [
        "[31m   ID      [39m[90m [39m[31m   URL         [39m[90m [39m[31m   Hostname   [39m[90m [39m[31m   Type        [39m
       test    [90m [39m   test.host   [90m [39m   Not set    [90m [39m   Container   
       test2   [90m [39m   Not set     [90m [39m   Not set    [90m [39m   Container   
       test3   [90m [39m   Not set     [90m [39m   Not set    [90m [39m   Container   
       test4   [90m [39m   Not set     [90m [39m   alias4     [90m [39m   Container   ",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  listServer.done();
});

// test
test('Should deauth on 401', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // handle correct request
  const listServer = nock('http://localhost:8080').get('/list').reply(401, { error: 'Deauth test' });

  // execute config generation
  program.parse(['list'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(listServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
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
  listServer.done();
  // reset config to original state
  resetUserConfig();
});
