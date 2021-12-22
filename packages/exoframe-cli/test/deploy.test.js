import { expect, jest, test } from '@jest/globals';
import fs from 'fs';
import _ from 'highland';
import { render } from 'ink-testing-library';
import nock from 'nock';
import path from 'path';
import React from 'react';
import { Readable } from 'stream';
import tar from 'tar-fs';
import { setTimeout } from 'timers/promises';
import { fileURLToPath } from 'url';

const baseFolder = path.dirname(fileURLToPath(import.meta.url));

const folder = 'test_html_project';
const folderPath = path.join('test', 'fixtures', folder);
const testFolder = path.join(baseFolder, 'fixtures', folder);

const ignoreFolder = 'test_ignore_project';
const ignoreFolderPath = path.join('test', 'fixtures', ignoreFolder);
const ignoreTestFolder = path.join(baseFolder, 'fixtures', ignoreFolder);

const customConfigFolder = 'test_custom_config_project';
const customConfigFolderPath = path.join('test', 'fixtures', customConfigFolder);

jest.unstable_mockModule('../src/config/index.js', () => {
  let config = {
    endpoint: 'http://localhost:8080',
    token: 'test',
  };

  return {
    isLoggedIn: jest.fn(() => true),
    getConfig: jest.fn(() => config),
    updateConfig: jest.fn((cfg) => {
      config = cfg;
    }),
    restoreConfig: jest.fn(() => {
      config = {
        endpoint: 'http://localhost:8080',
        token: 'test',
      };
    }),
  };
});

jest.unstable_mockModule('open', () => {
  const opn = jest.fn();
  return { default: opn };
});

// reply with stream helper
const replyWithStream = (dataArr) => {
  const replyStream = _();
  dataArr.forEach((data) => replyStream.write(JSON.stringify(data)));
  replyStream.end('');
  return [200, new Readable().wrap(replyStream)];
};

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

const DEPLOY_TIMEOUT = 100;

// import component
const { default: Deploy } = await import('../src/components/deploy/index.js');
const { updateConfig, restoreConfig } = await import('../src/config/index.js');
const { default: openMock } = await import('open');

test('Should deploy', async () => {
  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply((_uri, requestBody) => {
      const excgf = fs.readFileSync(path.join(testFolder, 'exoframe.json')).toString();
      const index = fs.readFileSync(path.join(testFolder, 'index.html')).toString();
      expect(requestBody).toContain(excgf);
      expect(requestBody).toContain(index);

      return replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]);
    });

  const { lastFrame } = render(<Deploy folder={folderPath} />);
  expect(lastFrame()).toMatchInlineSnapshot(`"Deploying test/fixtures/test_html_project to: http://localhost:8080"`);

  // give time to execute requests
  await setTimeout(DEPLOY_TIMEOUT);

  // make sure output is correct
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Deploying test/fixtures/test_html_project to: http://localhost:8080
    Deployed services:
    IDURLHostnameType
    testlocalhosttestContainer"
  `);

  // make sure server was actually called
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // tear down nock
  deployServer.done();
});

// test
test('Should deploy with endpoint flag', async () => {
  // handle correct request
  const deployServer = nock('http://localhost:3000')
    .post('/deploy')
    .reply((_uri, requestBody) => {
      const excgf = fs.readFileSync(path.join(testFolder, 'exoframe.json')).toString();
      const index = fs.readFileSync(path.join(testFolder, 'index.html')).toString();
      expect(requestBody).toContain(excgf);
      expect(requestBody).toContain(index);

      return replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]);
    });

  const { lastFrame } = render(<Deploy folder={folderPath} endpoint="http://localhost:3000" />);
  expect(lastFrame()).toMatchInlineSnapshot(`"Deploying test/fixtures/test_html_project to: http://localhost:3000"`);

  // give time to execute requests
  await setTimeout(DEPLOY_TIMEOUT);

  // make sure output is correct
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Deploying test/fixtures/test_html_project to: http://localhost:3000
    Deployed services:
    IDURLHostnameType
    testlocalhosttestContainer"
  `);

  // make sure server was actually called
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // tear down nock
  deployServer.done();
});

// test
test('Should deploy without path', async () => {
  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply(() => replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]));

  const { lastFrame } = render(<Deploy />);
  expect(lastFrame()).toMatchInlineSnapshot(`"Deploying current project to: http://localhost:8080"`);

  // give time to execute requests
  await setTimeout(DEPLOY_TIMEOUT);

  // make sure output is correct
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Deploying current project to: http://localhost:8080
    Deployed services:
    IDURLHostnameType
    testlocalhosttestContainer"
  `);

  // make sure server was actually called
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // tear down nock
  deployServer.done();
});

// test
test('Should deploy without auth but with token', async () => {
  // handle correct request
  const deployServer = nock('http://localhost:8080', {
    reqheaders: {
      Authorization: `Bearer test-token`,
    },
  })
    .post('/deploy')
    .reply(() => {
      return replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]);
    });

  // remove auth from config
  updateConfig({ endpoint: 'http://localhost:8080' });

  const { lastFrame } = render(<Deploy token="test-token" />);
  expect(lastFrame()).toMatchInlineSnapshot(`"Deploying current project to: http://localhost:8080"`);

  // give time to execute requests
  await setTimeout(DEPLOY_TIMEOUT);

  // make sure output is correct
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Deploying current project to: http://localhost:8080
    Deployed services:
    IDURLHostnameType
    testlocalhosttestContainer"
  `);

  // make sure server was actually called
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // tear down nock
  deployServer.done();
  // restore config
  restoreConfig();
});

// test
test('Should execute update', async () => {
  // handle correct request
  const updateServer = nock('http://localhost:8080')
    .post('/update')
    .reply(() => replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]));

  const { lastFrame } = render(<Deploy update={true} />);
  expect(lastFrame()).toMatchInlineSnapshot(`"Updating current project to: http://localhost:8080"`);

  // give time to execute requests
  await setTimeout(DEPLOY_TIMEOUT);

  // make sure output is correct
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Updating current project to: http://localhost:8080
    Deployed services:
    IDURLHostnameType
    testlocalhosttestContainer"
  `);

  // make sure server was actually called
  // check that server was called
  expect(updateServer.isDone()).toBeTruthy();
  // tear down nock
  updateServer.done();
});

// test
test('Should open webpage after deploy', async () => {
  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply(() => replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]));

  const { lastFrame } = render(<Deploy open={true} />);
  expect(lastFrame()).toMatchInlineSnapshot(`"Deploying current project to: http://localhost:8080"`);

  // give time to execute requests
  await setTimeout(DEPLOY_TIMEOUT);

  // make sure output is correct
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Deploying current project to: http://localhost:8080
    Deployed services:
    IDURLHostnameType
    testlocalhosttestContainer"
  `);

  // give time to call open
  await setTimeout(DEPLOY_TIMEOUT);

  // expect open to be called
  expect(openMock).toHaveBeenCalled();

  // make sure server was actually called
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // tear down nock
  deployServer.done();
});

// test
test('Should deploy with custom config', async () => {
  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply((_uri, requestBody, cb) => {
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

  const { lastFrame } = render(<Deploy folder={customConfigFolderPath} config="exoframe-custom.json" />);
  expect(lastFrame()).toMatchInlineSnapshot(
    `"Deploying test/fixtures/test_custom_config_project to: http://localhost:8080"`
  );

  // give time to execute requests
  await setTimeout(DEPLOY_TIMEOUT);

  // make sure output is correct
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Deploying test/fixtures/test_custom_config_project to: http://localhost:8080
    Deployed services:
    IDURLHostnameType
    testlocalhosttestContainer"
  `);

  // make sure server was actually called
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // tear down nock
  deployServer.done();
});

// test
test('Should display error log', async () => {
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

  const { lastFrame } = render(<Deploy />);
  expect(lastFrame()).toMatchInlineSnapshot(`"Deploying current project to: http://localhost:8080"`);

  // give time to execute requests
  await setTimeout(DEPLOY_TIMEOUT);

  // make sure output is correct
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Deploying current project to: http://localhost:8080
    Error: Build failed! See build log for details.
     Log:
      Error log
      here"
  `);

  // make sure server was actually called
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // tear down nock
  deployServer.done();
});

// test
test('Should display error on malformed JSON', async () => {
  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply((uri, requestBody, cb) => {
      cb(null, [200, 'Bad Gateway']);
    });

  const { lastFrame } = render(<Deploy />);
  expect(lastFrame()).toMatchInlineSnapshot(`"Deploying current project to: http://localhost:8080"`);

  // give time to execute requests
  await setTimeout(DEPLOY_TIMEOUT);

  // make sure output is correct
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Deploying current project to: http://localhost:8080
    Error: Bad Gateway"
  `);

  // make sure server was actually called
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // tear down nock
  deployServer.done();
});

// test
test('Should display verbose output', async () => {
  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply((uri, requestBody, cb) => {
      cb(null, [200, 'Bad Gateway']);
    });

  const { lastFrame } = render(<Deploy folder={ignoreFolderPath} verbose={3} />);
  expect(lastFrame()).toMatchInlineSnapshot(`"Deploying test/fixtures/test_ignore_project to: http://localhost:8080"`);

  // give time to execute requests
  await setTimeout(DEPLOY_TIMEOUT);

  // make sure output is correct
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Deploying test/fixtures/test_ignore_project to: http://localhost:8080
    Error: Bad Gateway
    Original error: Error: Error parsing output!
    Original response: {
      \\"error\\": \\"Bad Gateway\\"
    }"
  `);

  // make sure server was actually called
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // tear down nock
  deployServer.done();
});

// test ignore config
test('Should ignore specified files', async () => {
  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply((uri, requestBody) => {
      const exoignore = fs.readFileSync(path.join(ignoreTestFolder, '.exoframeignore')).toString();
      const ignoreme = fs.readFileSync(path.join(ignoreTestFolder, 'ignore.me')).toString();
      const index = fs.readFileSync(path.join(ignoreTestFolder, 'index.js')).toString();
      const packageJson = fs.readFileSync(path.join(ignoreTestFolder, 'package.json')).toString();
      const exocfg = fs.readFileSync(path.join(ignoreTestFolder, 'exoframe.json')).toString();
      const yarnLock = fs.readFileSync(path.join(ignoreTestFolder, 'yarn.lock')).toString();
      expect(requestBody).toContain(index);
      expect(requestBody).toContain(packageJson);
      expect(requestBody).toContain(exocfg);
      expect(requestBody).not.toContain(exoignore);
      expect(requestBody).not.toContain(ignoreme);
      expect(requestBody).not.toContain(yarnLock);

      return replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]);
    });

  const { lastFrame } = render(<Deploy folder={ignoreFolderPath} />);
  expect(lastFrame()).toMatchInlineSnapshot(`"Deploying test/fixtures/test_ignore_project to: http://localhost:8080"`);

  // give time to execute requests
  await setTimeout(DEPLOY_TIMEOUT);

  // make sure output is correct
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Deploying test/fixtures/test_ignore_project to: http://localhost:8080
    Deployed services:
    IDURLHostnameType
    testlocalhosttestContainer"
  `);

  // make sure server was actually called
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // tear down nock
  deployServer.done();
});

// test
test('Should display error on zero deployments', async () => {
  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply((uri, requestBody, cb) => {
      cb(null, [200, {}]);
    });

  const { lastFrame } = render(<Deploy />);
  expect(lastFrame()).toMatchInlineSnapshot(`"Deploying current project to: http://localhost:8080"`);

  // give time to execute requests
  await setTimeout(DEPLOY_TIMEOUT);

  // make sure output is correct
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Deploying current project to: http://localhost:8080
    Error: Error: Something went wrong!"
  `);

  // make sure server was actually called
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // tear down nock
  deployServer.done();
});

// test
test('Should not deploy with config without project name', async () => {
  // corrupt config with string
  const exoConfig = JSON.parse(fs.readFileSync(path.join(baseFolder, '..', 'exoframe.json')).toString());
  exoConfig.name = '';
  fs.writeFileSync(path.join(baseFolder, '..', 'exoframe.json'), JSON.stringify(exoConfig));

  const { lastFrame } = render(<Deploy />);
  expect(lastFrame()).toMatchInlineSnapshot(`"Deploying current project to: http://localhost:8080"`);

  // give time to execute requests
  await setTimeout(DEPLOY_TIMEOUT);

  // make sure output is correct
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Deploying current project to: http://localhost:8080
    Error: Error: Project should have a valid name in config!"
  `);
});

// test
test('Should not deploy with broken config', async () => {
  // corrupt config with string
  fs.writeFileSync(path.join(baseFolder, '..', 'exoframe.json'), 'I am broken json now');

  const { lastFrame } = render(<Deploy />);
  expect(lastFrame()).toMatchInlineSnapshot(`"Deploying current project to: http://localhost:8080"`);

  // give time to execute requests
  await setTimeout(DEPLOY_TIMEOUT);

  // make sure output is correct
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Deploying current project to: http://localhost:8080
    Error: Error: Your exoframe.json is not valid: {
      \\"name\\": \\"SyntaxError\\",
      \\"message\\": \\"Unexpected token I in JSON at position 0\\",
      \\"stack\\": \\"SyntaxError: Unexpected token I in JSON at position 0\\\\n    at JSON.parse (<anonymous>)\\\\n
        at deploy
    (/home/yamalight/github/exoframe/exoframe/packages/exoframe-client/src/deploy.js:143:19)\\\\n    at
    deployProject (/home/yamalight/github/exoframe/exoframe/packages/exoframe-cli/src/components/deploy/
    index.js:39:50)\\\\n    at
    /home/yamalight/github/exoframe/exoframe/packages/exoframe-cli/src/components/deploy/index.js:68:5\\\\n
        at invokePassiveEffectCreate (/home/yamalight/github/exoframe/exoframe/node_modules/react-reconc
    iler/cjs/react-reconciler.development.js:16054:20)\\\\n    at Object.invokeGuardedCallbackProd
    (/home/yamalight/github/exoframe/exoframe/node_modules/react-reconciler/cjs/react-reconciler.develop
    ment.js:12101:10)\\\\n    at invokeGuardedCallback (/home/yamalight/github/exoframe/exoframe/node_modul
    es/react-reconciler/cjs/react-reconciler.development.js:12292:31)\\\\n    at flushPassiveEffectsImpl
    (/home/yamalight/github/exoframe/exoframe/node_modules/react-reconciler/cjs/react-reconciler.develop
    ment.js:16141:9)\\\\n    at unstable_runWithPriority (/home/yamalight/github/exoframe/exoframe/node_mod
    ules/scheduler/cjs/scheduler.development.js:468:12)\\\\n    at runWithPriority (/home/yamalight/github/
    exoframe/exoframe/node_modules/react-reconciler/cjs/react-reconciler.development.js:2495:10)\\"
    }"
  `);

  // fix config
  fs.writeFileSync(path.join(baseFolder, '..', 'exoframe.json'), '{"name":"test"}');
});

// test
test('Should not deploy with non-existent path', async () => {
  const { lastFrame } = render(<Deploy folder={'i-do-not-exist'} />);
  expect(lastFrame()).toMatchInlineSnapshot(`"Deploying i-do-not-exist to: http://localhost:8080"`);

  // give time to execute requests
  await setTimeout(DEPLOY_TIMEOUT);

  // make sure output is correct
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Deploying i-do-not-exist to: http://localhost:8080
    Error: Error: Path do not exists"
  `);
});

// test
test('Should deauth on 401', async () => {
  // handle correct request
  const deployServer = nock('http://localhost:8080').post('/deploy').reply(401, { error: 'Deauth test' });

  const { lastFrame } = render(<Deploy />);
  expect(lastFrame()).toMatchInlineSnapshot(`"Deploying current project to: http://localhost:8080"`);

  // give time to execute requests
  await setTimeout(DEPLOY_TIMEOUT);

  // make sure output is correct
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Deploying current project to: http://localhost:8080
    Error: Error: authorization expired! Please, relogin and try again."
  `);

  // make sure server was actually called
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // tear down nock
  deployServer.done();
});
