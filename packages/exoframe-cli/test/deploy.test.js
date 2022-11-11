import { readFile } from 'fs/promises';
import _ from 'highland';
import nock from 'nock';
import { join } from 'path';
import { Readable } from 'stream';
import tar from 'tar-fs';
import { setTimeout } from 'timers/promises';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getUserConfig, resetUserConfig, setupDeployMocks } from './util/config.js';
import { fixturesFolder } from './util/paths.js';

// mock open() module for testing
vi.mock('open', () => {
  return {
    default: vi.fn(),
  };
});

// timeout for IO/net
const IO_TIMEOUT = 50;

// reply with stream helper
const replyWithStream = (dataArr) => {
  const replyStream = _();
  dataArr.forEach((data) => replyStream.write(JSON.stringify(data)));
  replyStream.end('');
  return [200, new Readable().wrap(replyStream)];
};

const folder = 'test_html_project';
const testFolder = join(fixturesFolder, folder);

const ignoreFolder = 'test_ignore_project';
const ignoreTestFolder = join(fixturesFolder, ignoreFolder);

const customConfigFolder = 'test_custom_config_project';
const customConfigFolderPath = join(fixturesFolder, customConfigFolder);

const nonameConfigFolder = 'test_noname_config';
const nonameConfigFolderPath = join(fixturesFolder, nonameConfigFolder);

const brokenConfigFolder = 'test_broken_config';
const brokenConfigFolderPath = join(fixturesFolder, brokenConfigFolder);

const deployments = [
  {
    Id: '123',
    Name: '/test',
    Config: {
      Labels: {
        'exoframe.deployment': 'test',
        'traefik.http.routers.test.rule': 'Host(`localhost`)',
      },
    },
    NetworkSettings: {
      Networks: {
        exoframe: {
          Aliases: ['123', 'test'],
        },
      },
    },
  },
];

const cleanLogsFromPaths = (logsArray) => {
  return logsArray.map((logs) =>
    logs.map((line) => {
      // if it's a string - replace paths
      if (typeof line === 'string') {
        return line?.replace?.(fixturesFolder, '');
      }
      // otherwise return original
      return line;
    })
  );
};

const open = (await import('open')).default;
let program;
let clearMocks;
beforeEach(async () => {
  // setup mocks
  clearMocks = setupDeployMocks();
  // import component
  const { createProgram } = await import('../src/index.js');
  program = await createProgram();
});
afterEach(() => clearMocks());

// test
test('Should deploy simple project', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply(async (_uri, requestBody) => {
      const excgf = await readFile(join(testFolder, 'exoframe.json'));
      const index = await readFile(join(testFolder, 'index.html'));
      expect(requestBody).toContain(excgf);
      expect(requestBody).toContain(index);

      return replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]);
    });

  // execute config generation
  program.parse(['deploy', '-v', testFolder], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(deployServer.isDone()).toBe(true);
  // first check console output
  expect(cleanLogsFromPaths(consoleSpy.mock.calls)).toMatchInlineSnapshot(`
    [
      [
        "Deploying /test_html_project to endpoint:",
        "http://localhost:8080",
      ],
      [
        "Your project is now deployed as:
    ",
      ],
      [
        "[31m   ID     [39m[90m [39m[31m   URL         [39m[90m [39m[31m   Hostname   [39m[90m [39m[31m   Type        [39m
       test   [90m [39m   localhost   [90m [39m   test       [90m [39m   Container   ",
      ],
    ]
  `);
  // restore mocks
  consoleSpy.mockReset();
  deployServer.done();
});

// test
test('Should deploy with endpoint flag', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // handle correct request
  const deployServer = nock('http://localhost:3000')
    .post('/deploy')
    .reply(async (_uri, requestBody) => {
      const excgf = await readFile(join(testFolder, 'exoframe.json'));
      const index = await readFile(join(testFolder, 'index.html'));
      expect(requestBody).toContain(excgf);
      expect(requestBody).toContain(index);

      return replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]);
    });

  // execute config generation
  program.parse(['deploy', '--endpoint', 'http://localhost:3000', testFolder], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // first check console output
  expect(cleanLogsFromPaths(consoleSpy.mock.calls)).toMatchInlineSnapshot(`
    [
      [
        "Deploying /test_html_project to endpoint:",
        "http://localhost:3000",
      ],
      [
        "Your project is now deployed as:
    ",
      ],
      [
        "[31m   ID     [39m[90m [39m[31m   URL         [39m[90m [39m[31m   Hostname   [39m[90m [39m[31m   Type        [39m
       test   [90m [39m   localhost   [90m [39m   test       [90m [39m   Container   ",
      ],
    ]
  `);
  // restore console
  consoleSpy.mockReset();
  deployServer.done();
});

// test
test('Should deploy without path', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const cwdSpy = vi.spyOn(process, 'cwd').mockImplementationOnce(() => join(testFolder));

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply(() => replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]));

  // execute config generation
  program.parse(['deploy', '-v'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);
  // make sure log in was successful
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // first check console output
  expect(cleanLogsFromPaths(consoleSpy.mock.calls)).toMatchInlineSnapshot(`
    [
      [
        "Deploying current project to endpoint:",
        "http://localhost:8080",
      ],
      [
        "Your project is now deployed as:
    ",
      ],
      [
        "[31m   ID     [39m[90m [39m[31m   URL         [39m[90m [39m[31m   Hostname   [39m[90m [39m[31m   Type        [39m
       test   [90m [39m   localhost   [90m [39m   test       [90m [39m   Container   ",
      ],
    ]
  `);
  // restore mocks
  consoleSpy.mockReset();
  cwdSpy.mockReset();
  deployServer.done();
});

// test
test('Should deploy with token', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // handle correct request
  const testToken = 'test-token';
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .matchHeader('Authorization', `Bearer ${testToken}`)
    .reply(() => replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]));

  // execute config generation
  program.parse(['deploy', '-v', '-t', testToken, testFolder], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // first check console output
  expect(cleanLogsFromPaths(consoleSpy.mock.calls)).toMatchInlineSnapshot(`
    [
      [
        "Deploying /test_html_project to endpoint:",
        "http://localhost:8080",
      ],
      [
        "
    Deploying using given token..",
      ],
      [
        "Your project is now deployed as:
    ",
      ],
      [
        "[31m   ID     [39m[90m [39m[31m   URL         [39m[90m [39m[31m   Hostname   [39m[90m [39m[31m   Type        [39m
       test   [90m [39m   localhost   [90m [39m   test       [90m [39m   Container   ",
      ],
    ]
  `);
  // restore mocks
  consoleSpy.mockReset();
  deployServer.done();
});

// test
test('Should execute update', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // handle correct request
  const updateServer = nock('http://localhost:8080')
    .post('/update')
    .reply(() => replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]));

  // execute config generation
  program.parse(['deploy', '-u', testFolder], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(updateServer.isDone()).toBeTruthy();
  // first check console output
  expect(cleanLogsFromPaths(consoleSpy.mock.calls)).toMatchInlineSnapshot(`
    [
      [
        "Updating /test_html_project to endpoint:",
        "http://localhost:8080",
      ],
      [
        "Your project is now deployed as:
    ",
      ],
      [
        "[31m   ID     [39m[90m [39m[31m   URL         [39m[90m [39m[31m   Hostname   [39m[90m [39m[31m   Type        [39m
       test   [90m [39m   localhost   [90m [39m   test       [90m [39m   Container   ",
      ],
    ]
  `);
  // restore mocks
  consoleSpy.mockReset();
  updateServer.done();
});

// test
test('Should open webpage after deploy', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply(() => replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]));

  // execute config generation
  program.parse(['deploy', '-o', testFolder], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // make sure opn was called once
  expect(open).toHaveBeenCalled();
  // first check console output
  expect(cleanLogsFromPaths(consoleSpy.mock.calls)).toMatchInlineSnapshot(`
    [
      [
        "Deploying /test_html_project to endpoint:",
        "http://localhost:8080",
      ],
      [
        "Your project is now deployed as:
    ",
      ],
      [
        "[31m   ID     [39m[90m [39m[31m   URL         [39m[90m [39m[31m   Hostname   [39m[90m [39m[31m   Type        [39m
       test   [90m [39m   localhost   [90m [39m   test       [90m [39m   Container   ",
      ],
      [
        "Opening deployed project in browser: localhost",
      ],
    ]
  `);
  // restore mocks
  consoleSpy.mockRestore();
  deployServer.done();
});

// test
test('Should deploy with a custom config', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply((uri, requestBody, cb) => {
      // console.log(uri, requestBody);
      // create new data stream and write array into it
      const s = new Readable();
      s.push(requestBody);
      s.push(null);

      // pipe stream to extraction
      const fileNames = [];
      s.pipe(
        tar.extract('./', {
          ignore: (name, header) => {
            fileNames.push(name);
            return true;
          },
          finish: () => {
            // validate that custom config was rename and is not packed
            expect(fileNames).toContain('exoframe.json');
            expect(fileNames).not.toContain('exoframe-custom.json');
            cb(null, replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]));
          },
        })
      );
    });

  // execute config generation
  program.parse(['deploy', '-c', 'exoframe-custom.json', customConfigFolderPath], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // first check console output
  expect(cleanLogsFromPaths(consoleSpy.mock.calls)).toMatchInlineSnapshot(`
  [
    [
      "Deploying /test_custom_config_project to endpoint:",
      "http://localhost:8080",
    ],
    [
      "Your project is now deployed as:
  ",
    ],
    [
      "[31m   ID     [39m[90m [39m[31m   URL         [39m[90m [39m[31m   Hostname   [39m[90m [39m[31m   Type        [39m
     test   [90m [39m   localhost   [90m [39m   test       [90m [39m   Container   ",
    ],
  ]
  `);
  // restore mocks
  consoleSpy.mockRestore();
  deployServer.done();
});

// test
test('Should display error log', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply(() =>
      replyWithStream([
        {
          message: 'Build failed! See build log for details.',
          error: 'Build failed! See build log for details.',
          log: ['Error log', 'here'],
          level: 'error',
        },
      ])
    );

  // execute config generation
  program.parse(['deploy', testFolder], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // first check console output
  expect(cleanLogsFromPaths(consoleSpy.mock.calls)).toMatchInlineSnapshot(`
    [
      [
        "Deploying /test_html_project to endpoint:",
        "http://localhost:8080",
      ],
      [
        "Error deploying project:",
        "Build failed! See build log for details.",
      ],
      [
        "Build log:
    ",
      ],
      [
        "Error log",
      ],
      [
        "here",
      ],
    ]
  `);
  // restore mocks
  consoleSpy.mockRestore();
  deployServer.done();
});

// test
test('Should display error on malformed JSON', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply((uri, requestBody, cb) => {
      cb(null, [200, 'Bad Gateway']);
    });

  // execute config generation
  program.parse(['deploy', testFolder], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // first check console output
  expect(cleanLogsFromPaths(consoleSpy.mock.calls)).toMatchInlineSnapshot(`
    [
      [
        "Deploying /test_html_project to endpoint:",
        "http://localhost:8080",
      ],
      [
        "Error deploying project:",
        "Bad Gateway",
      ],
      [
        "Build log:
    ",
      ],
      [
        "No log available",
      ],
    ]
  `);
  // restore mocks
  consoleSpy.mockRestore();
  deployServer.done();
});

// test
test('Should display verbose output', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply(() => [200, 'Bad Gateway']);

  // execute config generation
  program.parse(['deploy', '-vvv', testFolder], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // first check console output
  // check beginning of log
  expect(cleanLogsFromPaths(consoleSpy.mock.calls)).toMatchInlineSnapshot(`
    [
      [
        "Deploying /test_html_project to endpoint:",
        "http://localhost:8080",
      ],
      [
        "Error deploying project:",
        "Bad Gateway",
      ],
      [
        "Build log:
    ",
      ],
      [
        "No log available",
      ],
      [
        "",
      ],
      [
        "Original error:",
        [Error: Error parsing output!],
      ],
      [
        "Original response:",
        {
          "error": "Bad Gateway",
        },
      ],
    ]
  `);
  // restore mocks
  consoleSpy.mockRestore();
  deployServer.done();
});

// test ignore config
test('Should ignore specified files', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply(async (_uri, requestBody) => {
      const exoignore = await readFile(join(ignoreTestFolder, '.exoframeignore'));
      const ignoreme = await readFile(join(ignoreTestFolder, 'ignore.me'));
      const index = await readFile(join(ignoreTestFolder, 'index.js'));
      const packageJson = await readFile(join(ignoreTestFolder, 'package.json'));
      const exocfg = await readFile(join(ignoreTestFolder, 'exoframe.json'));
      const yarnLock = await readFile(join(ignoreTestFolder, 'yarn.lock'));
      expect(requestBody).toContain(index);
      expect(requestBody).toContain(packageJson);
      expect(requestBody).toContain(exocfg);
      expect(requestBody).not.toContain(exoignore);
      expect(requestBody).not.toContain(ignoreme);
      expect(requestBody).not.toContain(yarnLock);

      return replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]);
    });

  // execute config generation
  program.parse(['deploy', ignoreTestFolder], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // first check console output
  expect(cleanLogsFromPaths(consoleSpy.mock.calls)).toMatchInlineSnapshot(`
    [
      [
        "Deploying /test_ignore_project to endpoint:",
        "http://localhost:8080",
      ],
      [
        "Your project is now deployed as:
    ",
      ],
      [
        "[31m   ID     [39m[90m [39m[31m   URL         [39m[90m [39m[31m   Hostname   [39m[90m [39m[31m   Type        [39m
       test   [90m [39m   localhost   [90m [39m   test       [90m [39m   Container   ",
      ],
    ]
  `);
  // restore mocks
  consoleSpy.mockRestore();
  deployServer.done();
});

// test
test('Should display error on zero deployments', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply((uri, requestBody, cb) => {
      cb(null, [200, {}]);
    });

  // execute config generation
  program.parse(['deploy', testFolder], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // first check console output
  expect(cleanLogsFromPaths(consoleSpy.mock.calls)).toMatchInlineSnapshot(`
    [
      [
        "Deploying /test_html_project to endpoint:",
        "http://localhost:8080",
      ],
      [
        "Error deploying project:",
        "Error: Something went wrong!",
      ],
      [
        "Build log:
    ",
      ],
      [
        "No log available",
      ],
    ]
  `);
  // restore mocks
  consoleSpy.mockRestore();
  deployServer.done();
});

// test
test('Should not deploy with config without project name', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // execute config generation
  program.parse(['deploy', nonameConfigFolderPath], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // check console output
  expect(cleanLogsFromPaths(consoleSpy.mock.calls)).toMatchInlineSnapshot(`
    [
      [
        "Deploying /test_noname_config to endpoint:",
        "http://localhost:8080",
      ],
      [
        "Error deploying project:",
        "Error: Project should have a valid name in config!",
      ],
      [
        "Build log:
    ",
      ],
      [
        "No log available",
      ],
    ]
  `);
  // restore console
  consoleSpy.mockRestore();
});

// test
test('Should not deploy with broken config', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // execute config generation
  program.parse(['deploy', brokenConfigFolderPath], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // check error correctness
  const err = consoleSpy.mock.calls.flat().find((line) => line.includes('Your exoframe.json is not valid'));
  expect(err).toBeDefined();
  expect(err).toContain('Your exoframe.json is not valid');
  expect(err).toContain('SyntaxError');
  expect(err).toContain('Unexpected token');
  // restore console
  consoleSpy.mockRestore();
});

// test
test('Should not deploy with non-existent path', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // execute config generation
  program.parse(['deploy', 'i-do-no-exist'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // check error correctness
  expect(cleanLogsFromPaths(consoleSpy.mock.calls)).toMatchInlineSnapshot(`
    [
      [
        "Deploying i-do-no-exist to endpoint:",
        "http://localhost:8080",
      ],
      [
        "Error deploying project:",
        "Project folder not found!",
      ],
    ]
  `);
  // restore console
  consoleSpy.mockRestore();
});

// test
test('Should deauth on 401', async () => {
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // handle correct request
  const deployServer = nock('http://localhost:8080').post('/deploy').reply(401, { error: 'Deauth test' });

  // execute config generation
  program.parse(['deploy', testFolder], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // first check console output
  expect(cleanLogsFromPaths(consoleSpy.mock.calls)).toMatchInlineSnapshot(`
    [
      [
        "Deploying /test_html_project to endpoint:",
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
  deployServer.done();
  // reset config to original state
  resetUserConfig();
});
