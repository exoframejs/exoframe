import { expect, test } from '@jest/globals';
import fs from 'fs';
import _ from 'highland';
import nock from 'nock';
import path from 'path';
import { Readable } from 'stream';
import tar from 'tar-fs';
import { fileURLToPath } from 'url';
import { deploy } from '../src/deploy';

// reply with stream helper
const replyWithStream = (dataArr) => {
  const replyStream = _();
  dataArr.forEach((data) => replyStream.write(JSON.stringify(data)));
  replyStream.end();
  return [200, replyStream.toNodeStream()];
};

const baseFolder = path.dirname(fileURLToPath(import.meta.url));

const folder = 'test_html_project';
const folderPath = path.join('test', 'fixtures', folder);
const testFolder = path.join(baseFolder, 'fixtures', folder);

const ignoreFolder = 'test_ignore_project';
const ignoreFolderPath = path.join('test', 'fixtures', ignoreFolder);
const ignoreTestFolder = path.join(baseFolder, 'fixtures', ignoreFolder);

const customConfigFolder = 'test_custom_config_project';
const customConfigFolderPath = path.join('test', 'fixtures', customConfigFolder);

const nonameConfigFolder = 'test_noname';
const nonameConfigFolderPath = path.join('test', 'fixtures', nonameConfigFolder);

const brokenConfigFolder = 'test_broken_json';
const brokenConfigFolderPath = path.join('test', 'fixtures', brokenConfigFolder);

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

const endpoint = 'http://localhost:8080';

// test
test('Should deploy', async () => {
  // handle correct request
  const deployServer = nock(endpoint)
    .post('/deploy')
    .reply((_uri, requestBody) => {
      const excgf = fs.readFileSync(path.join(testFolder, 'exoframe.json')).toString();
      const index = fs.readFileSync(path.join(testFolder, 'index.html')).toString();
      expect(requestBody).toContain(excgf);
      expect(requestBody).toContain(index);

      return replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]);
    });

  // execute deploy
  const result = await deploy({ folder: folderPath, endpoint, token: 'test-token', verbose: 3 });
  // make sure log in was successful
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // make sure resulting snapshot is correct
  expect(result).toMatchSnapshot();
  // tear down nock
  deployServer.done();
});

// test
test('Should deploy with endpoint flag', async () => {
  // handle correct request
  const deployServer = nock('http://localhost:3000')
    .post('/deploy')
    .reply((uri, requestBody) => {
      const excgf = fs.readFileSync(path.join(testFolder, 'exoframe.json'));
      const index = fs.readFileSync(path.join(testFolder, 'index.html'));
      expect(requestBody).toContain(excgf);
      expect(requestBody).toContain(index);

      return replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]);
    });

  // execute deploy
  const result = await deploy({
    folder: folderPath,
    endpoint: 'http://localhost:3000',
    token: 'test-token',
    verbose: 3,
  });
  // make sure log in was successful
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // first check console output
  expect(result).toMatchSnapshot();
  // tear down nock
  deployServer.done();
});

// test
test('Should execute update', async () => {
  // handle correct request
  const updateServer = nock('http://localhost:8080')
    .post('/update')
    .reply(() => replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]));

  // execute login
  const result = await deploy({
    folder: folderPath,
    endpoint,
    token: 'test-token',
    verbose: 3,
    update: true,
  });

  // make sure log in was successful
  // check that server was called
  expect(updateServer.isDone()).toBeTruthy();
  // first check console output
  expect(result).toMatchSnapshot();
  // tear down nock
  updateServer.done();
});

// test
test('Should deploy with custom config', async () => {
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
          // @ts-ignore
          finish: () => {
            // validate that custom config was rename and is not packed
            expect(fileNames).toContain('exoframe.json');
            expect(fileNames).not.toContain('exoframe-custom.json');
            cb(null, replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]));
          },
        })
      );
    });

  // execute login
  const result = await deploy({
    folder: customConfigFolderPath,
    configFile: 'exoframe-custom.json',
    endpoint,
    token: 'test-token',
    verbose: 3,
  });
  // make sure log in was successful
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // first check console output
  expect(result).toMatchSnapshot();
  // tear down nock
  deployServer.done();
});

// test
test('Should return error log', async () => {
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

  // execute
  try {
    await deploy({ folder: folderPath, endpoint, token: 'test-token', verbose: 3 });
  } catch (err) {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // first check console output
    expect(err.response).toMatchSnapshot();
    // tear down nock
    deployServer.done();
  }
});

// test
test('Should throw error on malformed JSON', async () => {
  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply((uri, requestBody, cb) => {
      cb(null, [200, 'Bad Gateway']);
    });

  // execute
  try {
    await deploy({ folder: folderPath, endpoint, token: 'test-token', verbose: 3 });
  } catch (err) {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // first check console output
    expect(err.response).toMatchSnapshot();
    // tear down nock
    deployServer.done();
  }
});

// test ignore config
test('Should ignore specified files', async () => {
  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply((uri, requestBody) => {
      const exoignore = fs.readFileSync(path.join(ignoreTestFolder, '.exoframeignore'));
      const ignoreme = fs.readFileSync(path.join(ignoreTestFolder, 'ignore.me'));
      const index = fs.readFileSync(path.join(ignoreTestFolder, 'index.js'));
      const packageJson = fs.readFileSync(path.join(ignoreTestFolder, 'package.json'));
      const exocfg = fs.readFileSync(path.join(ignoreTestFolder, 'exoframe.json'));
      const yarnLock = fs.readFileSync(path.join(ignoreTestFolder, 'yarn.lock'));
      expect(requestBody).toContain(index);
      expect(requestBody).toContain(packageJson);
      expect(requestBody).toContain(exocfg);
      expect(requestBody).not.toContain(exoignore);
      expect(requestBody).not.toContain(ignoreme);
      expect(requestBody).not.toContain(yarnLock);

      return replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]);
    });

  // execute login
  const result = await deploy({ folder: ignoreFolderPath, endpoint, token: 'test-token', verbose: 3 });
  // make sure log in was successful
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // first check console output
  expect(result).toMatchSnapshot();
  // tear down nock
  deployServer.done();
});

// test
test('Should throw error on zero deployments', async () => {
  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply((uri, requestBody, cb) => {
      cb(null, [200, {}]);
    });

  // execute
  try {
    await deploy({ folder: folderPath, endpoint, token: 'test-token', verbose: 3 });
  } catch (err) {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // first check console output
    expect(err).toMatchSnapshot();
    // tear down nock
    deployServer.done();
  }
});

// test
test('Should not deploy with config without project name', async () => {
  // execute deploy
  try {
    await deploy({ folder: nonameConfigFolderPath, endpoint, token: 'test-token', verbose: 3 });
  } catch (err) {
    // check console output
    expect(err).toMatchSnapshot();
  }
});

// test
test('Should not deploy with broken config', async () => {
  // execute deploy
  try {
    await deploy({ folder: brokenConfigFolderPath, endpoint, token: 'test-token', verbose: 3 });
  } catch (err) {
    // check console output
    const cleanError = err.toString().replaceAll(baseFolder, '');
    expect(cleanError).toMatchSnapshot();
  }
});

// test
test('Should not deploy with non-existent path', async () => {
  try {
    await deploy({ folder: 'i-do-not-exist-at-all', endpoint, token: 'test-token', verbose: 3 });
  } catch (err) {
    // check console output
    expect(err).toMatchSnapshot();
  }
});

// test
test('Should throw an error on 401', async () => {
  // handle correct request
  const deployServer = nock('http://localhost:8080').post('/deploy').reply(401, { error: 'Deauth test' });
  // execute login
  try {
    await deploy({ folder: folderPath, endpoint, token: 'test-token', verbose: 3 });
  } catch (err) {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // first check console output
    expect(err).toMatchSnapshot();
    expect(err.response.statusCode).toEqual(401);
    // tear down nock
    deployServer.done();
  }
});
