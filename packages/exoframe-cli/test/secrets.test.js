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
const testSecret = {
  secretName: 'test',
  secretValue: '12345',
};

let program;
beforeEach(async () => {
  // reset user config
  await resetUserConfig();
  // import component
  const { createProgram } = await import('../src/index.js');
  program = await createProgram();
});
afterAll(() => clearMocks());

test('Should create new secret from user input', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const secretServer = nock('http://localhost:8080')
    .post('/secrets')
    .reply(200, { name: testSecret.secretName, value: testSecret.secretValue });

  // stub inquirer answers
  const enqSpy = vi.spyOn(inquirer, 'prompt').mockImplementationOnce(() => Promise.resolve(testSecret));

  // execute logs
  program.parse(['secret', 'add'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(secretServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Generating new deployment secret for:",
        "http://localhost:8080",
      ],
      [
        "New secret generated:",
      ],
      [
        "",
      ],
      [
        "Name: test",
      ],
      [
        "Value: 12345",
      ],
      [
        "",
      ],
      [
        "DONE!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockRestore();
  enqSpy.mockRestore();
  secretServer.done();
});

test('Should create new secret from flags', async () => {
  const localSecret = { name: 'local', value: 'secret' };
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const secretServer = nock('http://localhost:8080')
    .post('/secrets')
    .reply(200, { name: localSecret.name, value: localSecret.value });

  // execute logs
  program.parse(['secret', 'add', '--name', localSecret.name, '--value', localSecret.value], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(secretServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Generating new deployment secret for:",
        "http://localhost:8080",
      ],
      [
        "New secret generated:",
      ],
      [
        "",
      ],
      [
        "Name: local",
      ],
      [
        "Value: secret",
      ],
      [
        "",
      ],
      [
        "DONE!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockRestore();
  secretServer.done();
});

test('Should list secrets', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const createDate = new Date(2017, 1, 1, 1, 1, 1, 1);
  const secretsServer = nock('http://localhost:8080')
    .get('/secrets')
    .reply(200, { secrets: [{ name: testSecret.secretName, meta: { created: createDate } }] });

  // execute logs
  program.parse(['secret', 'ls'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(secretsServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls.map((lines) => lines.map((l) => l.replace(createDate.toLocaleString(), ''))))
    .toMatchInlineSnapshot(`
      [
        [
          "Listing deployment secrets for:",
          "http://localhost:8080",
        ],
        [
          "Got saved secrets:",
        ],
        [
          "",
        ],
        [
          "  > @test []",
        ],
      ]
    `);
  // clear mocks
  consoleSpy.mockRestore();
  secretsServer.done();
});

test('Should list zero secrets', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const secretsServer = nock('http://localhost:8080').get('/secrets').reply(200, { secrets: [] });

  // execute logs
  program.parse(['secret', 'ls'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(secretsServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Listing deployment secrets for:",
        "http://localhost:8080",
      ],
      [
        "Got saved secrets:",
      ],
      [
        "",
      ],
      [
        "  > No deployment secrets available!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockRestore();
  secretsServer.done();
});

test('Should get secret value', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request for list
  const createDate = new Date(2017, 1, 1, 1, 1, 1, 1);
  const secretsServer = nock('http://localhost:8080')
    .get('/secrets')
    .reply(200, { secrets: [{ name: testSecret.secretName, meta: { created: createDate } }] });
  // handle correct request for secret value
  const secretServer = nock('http://localhost:8080')
    .get(`/secrets/${testSecret.secretName}`)
    .reply(200, { secret: { ...testSecret, meta: { created: createDate } } });

  // stub inquirer answers
  const enqSpy = vi
    .spyOn(inquirer, 'prompt')
    .mockImplementationOnce(() => Promise.resolve({ selectedSecret: testSecret.secretName }))
    .mockImplementationOnce(() => Promise.resolve({ doGet: true }));

  // execute logs
  program.parse(['secret', 'get'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(secretsServer.isDone()).toBeTruthy();
  expect(secretServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls.map((lines) => lines.map((l) => l.replace(createDate.toLocaleString(), ''))))
    .toMatchInlineSnapshot(`
      [
        [
          "Getting deployment secret for:",
          "http://localhost:8080",
        ],
        [
          "Current secret value:",
        ],
        [
          "",
        ],
        [
          "Name: test",
        ],
        [
          "Value: 12345",
        ],
        [
          "Date: ",
        ],
      ]
    `);
  // clear mocks
  consoleSpy.mockRestore();
  enqSpy.mockRestore();
  secretsServer.done();
  secretServer.done();
});

test('Should get secret value via argument', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request for secret value
  const createDate = new Date(2017, 1, 1, 1, 1, 1, 1);
  const secretServer = nock('http://localhost:8080')
    .get(`/secrets/${testSecret.secretName}`)
    .reply(200, { secret: { ...testSecret, meta: { created: createDate } } });

  // execute logs
  program.parse(['secret', 'get', '-y', testSecret.secretName], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(secretServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls.map((lines) => lines.map((l) => l.replace(createDate.toLocaleString(), ''))))
    .toMatchInlineSnapshot(`
      [
        [
          "Getting deployment secret for:",
          "http://localhost:8080",
        ],
        [
          "Current secret value:",
        ],
        [
          "",
        ],
        [
          "Name: test",
        ],
        [
          "Value: 12345",
        ],
        [
          "Date: ",
        ],
      ]
    `);
  // clear mocks
  consoleSpy.mockRestore();
  secretServer.done();
});

test('Should remove secret via interactive input', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request for list
  const createDate = new Date(2017, 1, 1, 1, 1, 1, 1);
  const secretsServer = nock('http://localhost:8080')
    .get('/secrets')
    .reply(200, { secrets: [{ name: testSecret.secretName, meta: { created: createDate } }] });
  // handle correct request for secret removal
  const secretServer = nock('http://localhost:8080').delete('/secrets').reply(204, '');

  // stub inquirer answers
  const enqSpy = vi
    .spyOn(inquirer, 'prompt')
    .mockImplementationOnce(() => Promise.resolve({ selectedSecret: testSecret.secretName }));

  // execute logs
  program.parse(['secret', 'remove'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that servers were called
  expect(secretsServer.isDone()).toBeTruthy();
  expect(secretServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Removing deployment secret for:",
        "http://localhost:8080",
      ],
      [
        "Deployment secret test successfully removed!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockRestore();
  enqSpy.mockRestore();
  secretsServer.done();
  secretServer.done();
});

test('Should remove secret via flags', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request for secret removal
  const secretServer = nock('http://localhost:8080').delete('/secrets').reply(204, '');

  // execute logs
  program.parse(['secret', 'remove', testSecret.secretName], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that servers were called
  expect(secretServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Removing deployment secret for:",
        "http://localhost:8080",
      ],
      [
        "Deployment secret test successfully removed!",
      ],
    ]
  `);
  // clear mocks
  consoleSpy.mockRestore();
  secretServer.done();
});

test('Should deauth on 401 on creation', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const secretServer = nock('http://localhost:8080').post('/secrets').reply(401);

  // execute logs
  program.parse(['secret', 'add', '--name', 'test', '--value', 'deauth'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(secretServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Generating new deployment secret for:",
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
  // clear mocks
  consoleSpy.mockRestore();
  secretServer.done();
});

// TODO: update how config works then re-enable this
test.skip('Should deauth on 401 on list', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // handle correct request
  const secretsServer = nock('http://localhost:8080').get('/secrets').reply(401);

  // execute logs
  program.parse(['secret', 'ls'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(secretsServer.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Listing deployment secrets for:",
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
  // clear mocks
  consoleSpy.mockRestore();
  secretsServer.done();
});
