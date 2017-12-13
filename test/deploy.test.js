/* eslint-env jest */
// npm packages
const fs = require('fs');
const path = require('path');
const nock = require('nock');
const sinon = require('sinon');
const _ = require('highland');
const {Readable} = require('stream');

// our packages
const {cleanLogs} = require('./util');
const {userConfig, updateConfig} = require('../src/config');

// require deploy with stub for opn
jest.mock('opn', () => jest.fn());
const opnMock = require('opn');
const {handler: deploy} = require('../src/commands/deploy');

// reply with stream helper
const replyWithStream = dataArr => {
  const replyStream = _();
  dataArr.forEach(data => replyStream.write(JSON.stringify(data)));
  replyStream.end('');
  return new Readable().wrap(replyStream);
};

const folder = 'test_html_project';
const folderPath = path.join('test', 'fixtures', folder);
const testFolder = path.join(__dirname, 'fixtures', folder);

const deployments = [
  {
    Id: '123',
    Name: '/test',
    Config: {
      Labels: {
        'traefik.frontend.rule': 'Host:localhost',
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

// test
test('Should deploy', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply((uri, requestBody) => {
      const excgf = fs.readFileSync(path.join(testFolder, 'exoframe.json'));
      const index = fs.readFileSync(path.join(testFolder, 'index.html'));
      expect(requestBody).toContain(excgf);
      expect(requestBody).toContain(index);

      return replyWithStream([{message: 'Deployment success!', deployments, level: 'info'}]);
    });

  // execute login
  deploy({_: [folderPath]}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      [`Deploying ${folderPath} to endpoint:`, 'http://localhost:8080'],
      ['Your project is now deployed as:\n'],
      ['   ID         URL             Hostname   \n   test       localhost       test       '],
    ]);
    // restore console
    console.log.restore();
    // tear down nock
    deployServer.done();
    done();
  });
});

// test
test('Should deploy without path', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply(() => replyWithStream([{message: 'Deployment success!', deployments, level: 'info'}]));

  // execute login
  deploy().then(() => {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      ['Deploying current project to endpoint:', 'http://localhost:8080'],
      ['Your project is now deployed as:\n'],
      ['   ID         URL             Hostname   \n   test       localhost       test       '],
    ]);
    // restore console
    console.log.restore();
    // tear down nock
    deployServer.done();
    done();
  });
});

// test
test('Should deploy without auth but with token', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // copy original config for restoration
  const originalConfig = Object.assign({}, userConfig);

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply(() => replyWithStream([{message: 'Deployment success!', deployments, level: 'info'}]));

  // remove auth from config
  updateConfig({endpoint: 'http://localhost:8080'});

  // execute login
  deploy({token: 'test-token'}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      ['Deploying current project to endpoint:', 'http://localhost:8080'],
      ['\nDeploying using given token..'],
      ['Your project is now deployed as:\n'],
      ['   ID         URL             Hostname   \n   test       localhost       test       '],
    ]);
    // restore console
    console.log.restore();
    // tear down nock
    deployServer.done();
    // restore original config
    updateConfig(originalConfig);
    done();
  });
});

// test
test('Should execute update', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  // handle correct request
  const updateServer = nock('http://localhost:8080')
    .post('/update')
    .reply(() => replyWithStream([{message: 'Deployment success!', deployments, level: 'info'}]));

  // execute login
  deploy({update: true}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(updateServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      ['Updating current project to endpoint:', 'http://localhost:8080'],
      ['Your project is now deployed as:\n'],
      ['   ID         URL             Hostname   \n   test       localhost       test       '],
    ]);
    // restore console
    console.log.restore();
    // tear down nock
    updateServer.done();
    done();
  });
});

// test
test('Should open webpage after deploy', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply(() => replyWithStream([{message: 'Deployment success!', deployments, level: 'info'}]));

  // execute
  deploy({open: true}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // make sure opn was called once
    expect(opnMock).toHaveBeenCalled();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      ['Deploying current project to endpoint:', 'http://localhost:8080'],
      ['Your project is now deployed as:\n'],
      ['   ID         URL             Hostname   \n   test       localhost       test       '],
    ]);
    // restore console
    console.log.restore();
    // tear down nock
    deployServer.done();
    done();
  });
});

// test
test('Should display error log', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

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
  deploy().then(() => {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      ['Deploying current project to endpoint:', 'http://localhost:8080'],
      ['Error deploying project:', 'Build failed! See build log for details.'],
      ['Build log:\n'],
      ['Error log'],
      ['here'],
    ]);
    // restore console
    console.log.restore();
    // tear down nock
    deployServer.done();
    done();
  });
});

// test
test('Should display error on malformed JSON', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply((uri, requestBody, cb) => {
      cb(null, [200, 'Bad Gateway']);
    });

  // execute
  deploy().then(() => {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      ['Deploying current project to endpoint:', 'http://localhost:8080'],
      ['Error deploying project:', 'Bad Gateway'],
      ['Build log:\n'],
      ['No log available'],
    ]);
    // restore console
    console.log.restore();
    // tear down nock
    deployServer.done();
    done();
  });
});

// test
test('Should display verbose output', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply((uri, requestBody, cb) => {
      cb(null, [200, 'Bad Gateway']);
    });

  // execute
  deploy({verbose: true}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    // check beginning of log
    expect(cleanedLogs.slice(0, consoleSpy.args.length - 1)).toEqual([
      ['Deploying current project to endpoint:', 'http://localhost:8080'],
      ['\nIgnoring following paths:', ['.git', 'node_modules']],
      ['[error]', 'Error parsing line:', 'Bad Gateway'],
      ['Error deploying project:', 'Bad Gateway'],
      ['Build log:\n'],
      ['No log available'],
      [''],
    ]);
    // check error correctness
    const err = consoleSpy.args[consoleSpy.args.length - 1][1];
    expect(err.message).toEqual('Error parsing output!');
    expect(err.response).toBeDefined();
    expect(err.response.error).toEqual('Bad Gateway');
    // restore console
    console.log.restore();
    // tear down nock
    deployServer.done();
    done();
  });
});

// test
test('Should display error on zero deployments', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply((uri, requestBody, cb) => {
      cb(null, [200, {}]);
    });

  // execute
  deploy().then(() => {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      ['Deploying current project to endpoint:', 'http://localhost:8080'],
      ['Error deploying project:', 'Error: Something went wrong!'],
      ['Build log:\n'],
      ['No log available'],
    ]);
    // restore console
    console.log.restore();
    // tear down nock
    deployServer.done();
    done();
  });
});

// test
test('Should not deploy with config without project name', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  // corrupt config with string
  const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'exoframe.json')));
  cfg.name = '';
  fs.writeFileSync(path.join(__dirname, '..', 'exoframe.json'), JSON.stringify(cfg));

  // execute deploy
  deploy().then(() => {
    // check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      ['Deploying current project to endpoint:', 'http://localhost:8080'],
      ['Please, check your config and try again:', 'Error: Project should have a valid name in config!'],
    ]);
    // restore console
    console.log.restore();
    done();
  });
});

// test
test('Should not deploy with broken config', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  // corrupt config with string
  fs.writeFileSync(path.join(__dirname, '..', 'exoframe.json'), 'I am broken json now');

  // execute deploy
  deploy().then(() => {
    // check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      ['Deploying current project to endpoint:', 'http://localhost:8080'],
      ['Please, check your config and try again:', 'SyntaxError: Unexpected token I in JSON at position 0'],
    ]);
    // restore console
    console.log.restore();
    done();
  });
});

// test
test('Should not deploy with non-existent path', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  // execute deploy
  deploy({_: ['i-do-not-exist']}).then(() => {
    // check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      ['Deploying i-do-not-exist to endpoint:', 'http://localhost:8080'],
      [`Error! Path ${path.join(process.cwd(), 'i-do-not-exist')} do not exists`],
      ['Please, check your arguments and try again.'],
    ]);
    // restore console
    console.log.restore();
    done();
  });
});

// test
test('Should deauth on 401', done => {
  // copy original config for restoration
  const originalConfig = Object.assign({}, userConfig);
  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply(401, {error: 'Deauth test'});
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // execute login
  deploy({_: [folderPath]}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      [`Deploying ${folderPath} to endpoint:`, 'http://localhost:8080'],
      ['Error: authorization expired!', 'Please, relogin and try again.'],
    ]);
    // check config
    expect(userConfig.user).toBeUndefined();
    expect(userConfig.token).toBeUndefined();
    // restore console
    console.log.restore();
    // tear down nock
    deployServer.done();
    // restore original config
    updateConfig(originalConfig);
    done();
  });
});
