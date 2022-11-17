import nock from 'nock';
import { Readable } from 'stream';
import { setTimeout } from 'timers/promises';
import { afterAll, beforeEach, expect, test, vi } from 'vitest';
import { getUserConfig, resetUserConfig, setupMocks } from './util/config.js';

// setup mocks
const clearMocks = setupMocks();

// timeout for IO/net
const IO_TIMEOUT = 50;

// mock response data
const id = 'test-id';
const date1 = '2017-05-18T15:16:40.120990460Z';
const date2 = '2017-05-18T15:16:40.212591019Z';
const date3 = '2017-05-18T15:16:40.375554362Z';
const dateToLocaleDate = (str) => `${new Date(str).toLocaleDateString()} ${new Date(str).toLocaleTimeString()}`;
const localeDate1 = dateToLocaleDate(date1);
const localeDate2 = dateToLocaleDate(date2);
const localeDate3 = dateToLocaleDate(date3);
const dirtyLogs = [
  `\u0001\u0000\u0000\u0000\u0000\u0000\u0000g${date1} yarn start v0.24.4`,
  `\u0001\u0000\u0000\u0000\u0000\u0000\u0000${date2} $ node index.js `,
  `\u0001\u0000\u0000\u0000\u0000\u0000\u0000${date3} Listening on port 80`,
  '',
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
  const readable = new Readable();
  const emitLogs = () => {
    dirtyLogs.forEach((item) => readable.push(`${item}\n`));
    // no more data
    readable.push(null);
  };
  // handle correct request
  const logServer = nock('http://localhost:8080')
    .get(`/logs/${id}`)
    .reply(200, () => {
      emitLogs();
      return readable;
    });

  // execute logs
  program.parse(['logs', id], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(logServer.isDone()).toBeTruthy();
  // first check console output
  const logsWithoutDates = consoleSpy.mock.calls.map((calls) =>
    calls.map((l) => l.replace(localeDate1, '').replace(localeDate2, '').replace(localeDate3, ''))
  );
  expect(logsWithoutDates).toMatchInlineSnapshot(`
    [
      [
        "Getting logs for deployment:",
        "test-id",
        "
    ",
      ],
      [
        " yarn start v0.24.4",
      ],
      [
        " $ node index.js ",
      ],
      [
        " Listening on port 80",
      ],
      [
        "
    End of log for test-id",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  logServer.done();
});

test('Should deauth on 401', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const logServer = nock('http://localhost:8080').get(`/logs/${id}`).reply(401);

  // execute logs
  program.parse(['logs', id], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(logServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Getting logs for deployment:",
        "test-id",
        "
    ",
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
  logServer.done();
  // reset config to original state
  resetUserConfig();
});
