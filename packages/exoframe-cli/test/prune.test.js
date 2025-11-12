import nock from 'nock';
import { setTimeout } from 'timers/promises';
import { afterAll, beforeEach, expect, test, vi } from 'vitest';
import { setupMocks } from './util/config.js';

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

test('Should execute prune', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct requests
  const pruneServer = nock('http://localhost:8080')
    .post('/system/prune')
    .reply(200, { pruned: true, data: [{ SpaceReclaimed: 1024 }] });

  // execute logs
  await program.parseAsync(['system', 'prune'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(pruneServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Prunning docker system on:",
        "http://localhost:8080",
      ],
      [
        "Data prune successful!",
      ],
      [
        "",
      ],
      [
        "Reclaimed:",
        "1.02 kB",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockReset();
  pruneServer.done();
});
