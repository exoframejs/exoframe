import md5 from 'apache-md5';
import inquirer from 'inquirer';
import { setTimeout } from 'timers/promises';
import { afterAll, afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getConfig, removeConfig, resetConfig, setupMocks } from './util/config.js';

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

// restore original config after each test
afterEach(() => resetConfig());

const users = [
  { username: 'user1', password: 'pass', askAgain: true },
  { username: 'user2', password: 'pass', askAgain: false },
];
const verifyBasicAuth = (input, actual) => {
  actual.split(',').forEach((element, index) => {
    const hash = element.split(':')[1];
    expect(hash).toEqual(md5(input[index].password, hash));
  });
};

// test config generation
test('Should generate new config file', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // remove current config
  removeConfig();

  // execute config generation
  await program.parseAsync(['config', '--init'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Creating new config..",
      ],
      [
        "Mode changed to",
        "non-interactive",
      ],
      [
        "Config saved!",
      ],
    ]
  `);
  // then check config changes
  const cfg = await getConfig();
  expect(cfg).toMatchInlineSnapshot(`
    {
      "name": "config-test",
      "rateLimit": {},
    }
  `);
  // restore console
  consoleSpy.mockReset();
});

test('Should update config in non-interactive mode using values from parameters', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // execute config update
  await program.parseAsync(
    [
      'config',
      '--domain',
      'test123.dev',
      '--port',
      '1234',
      '--restart',
      'unless-stopped',
      '--project',
      'give-project-name',
      '--name',
      'test name 123',
      '--hostname',
      'test123.dev',
    ],
    { from: 'user' }
  );

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Config already exists! Editing..",
      ],
      [
        "Mode changed to",
        "non-interactive",
      ],
      [
        "Setting",
        "domain",
        "to",
        "test123.dev",
      ],
      [
        "Setting",
        "port",
        "to",
        "1234",
      ],
      [
        "Setting",
        "name",
        "to",
        "test name 123",
      ],
      [
        "Setting",
        "project",
        "to",
        "give-project-name",
      ],
      [
        "Setting",
        "restart",
        "to",
        "unless-stopped",
      ],
      [
        "Setting",
        "hostname",
        "to",
        "test123.dev",
      ],
      [
        "Config saved!",
      ],
    ]
  `);
  // then check config changes
  const cfg = await getConfig();
  expect(cfg.name).toEqual('test name 123');
  expect(cfg.restart).toEqual('unless-stopped');
  expect(cfg.domain).toEqual('test123.dev');
  expect(cfg.port).toEqual('1234');
  expect(cfg.project).toEqual('give-project-name');
  expect(cfg.hostname).toEqual('test123.dev');
  // restore console
  consoleSpy.mockReset();
});

test('Should update config in interactive mode', async () => {
  // update name interactively
  const newName = 'new name';
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // stub inquirer answers
  const inquirerSpy = vi
    .spyOn(inquirer, 'prompt')
    .mockImplementationOnce(() => Promise.resolve({ prop: 'name' }))
    .mockImplementationOnce(() => Promise.resolve({ name: newName }));

  // execute config update
  await program.parseAsync(['config'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // check result
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Config already exists! Editing..",
      ],
      [
        "Config saved!",
      ],
    ]
  `);
  // then check config changes
  const cfg = await getConfig();
  expect(cfg.name).toEqual(newName);
  // restore console
  consoleSpy.mockReset();
  inquirerSpy.mockReset();
});

test('Should add users basic auth to config', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // stub inquirer answers
  const inquirerSpy = vi
    .spyOn(inquirer, 'prompt')
    .mockImplementationOnce(() => Promise.resolve(users[0]))
    .mockImplementationOnce(() => Promise.resolve(users[1]));

  // execute config update
  await program.parseAsync(['config', 'auth'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // check result
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Config already exists! Editing..",
      ],
      [
        "Config saved!",
      ],
    ]
  `);
  // then check config changes
  const cfg = await getConfig();
  verifyBasicAuth(users, cfg.basicAuth);
  // restore console
  consoleSpy.mockReset();
  inquirerSpy.mockReset();
});
