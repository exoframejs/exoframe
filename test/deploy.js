// npm packages
const tap = require('tap');
const fs = require('fs');
const path = require('path');
const nock = require('nock');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

// our packages
const {userConfig, updateConfig} = require('../src/config');

// opn stub
const opnStub = sinon.spy();

// require deploy with stub for opn
const {handler: deploy} = proxyquire('../src/commands/deploy', {opn: opnStub});

module.exports = () => {
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
  tap.test('Should deploy', t => {
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');

    // handle correct request
    const deployServer = nock('http://localhost:8080')
      .post('/deploy')
      .reply((uri, requestBody, cb) => {
        const excgf = fs.readFileSync(path.join(testFolder, 'exoframe.json'));
        const index = fs.readFileSync(path.join(testFolder, 'index.html'));
        t.ok(requestBody.includes(excgf), 'Should send correct config');
        t.ok(requestBody.includes(index), 'Should send correct index file');

        cb(null, [200, {status: 'success', deployments}]);
      });

    // execute login
    deploy({_: [folderPath]}).then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(deployServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          [`Deploying ${folderPath} to endpoint:`, 'http://localhost:8080'],
          ['Your project is now deployed as:\n'],
          ['   ID         URL             Hostname   \n   test       localhost       test       '],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      // tear down nock
      deployServer.done();
      t.end();
    });
  });

  // test
  tap.test('Should deploy without path', t => {
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');

    // handle correct request
    const deployServer = nock('http://localhost:8080')
      .post('/deploy')
      .reply((uri, requestBody, cb) => {
        cb(null, [200, {status: 'success', deployments}]);
      });

    // execute login
    deploy().then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(deployServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['Deploying current project to endpoint:', 'http://localhost:8080'],
          ['Your project is now deployed as:\n'],
          ['   ID         URL             Hostname   \n   test       localhost       test       '],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      // tear down nock
      deployServer.done();
      t.end();
    });
  });

  // test
  tap.test('Should deploy without auth but with token', t => {
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // copy original config for restoration
    const originalConfig = Object.assign({}, userConfig);

    // handle correct request
    const deployServer = nock('http://localhost:8080')
      .post('/deploy')
      .reply((uri, requestBody, cb) => {
        cb(null, [200, {status: 'success', deployments}]);
      });

    // remove auth from config
    updateConfig({endpoint: 'http://localhost:8080'});

    // execute login
    deploy({token: 'test-token'}).then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(deployServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['Deploying current project to endpoint:', 'http://localhost:8080'],
          ['Deploying using given token..'],
          ['Your project is now deployed as:\n'],
          ['   ID         URL             Hostname   \n   test       localhost       test       '],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      // tear down nock
      deployServer.done();
      // restore original config
      updateConfig(originalConfig);
      t.end();
    });
  });

  // test
  tap.test('Should execute update', t => {
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');

    // handle correct request
    const updateServer = nock('http://localhost:8080')
      .post('/update')
      .reply((uri, requestBody, cb) => {
        cb(null, [200, {status: 'success', deployments}]);
      });

    // execute login
    deploy({update: true}).then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(updateServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['Updating current project to endpoint:', 'http://localhost:8080'],
          ['Your project is now deployed as:\n'],
          ['   ID         URL             Hostname   \n   test       localhost       test       '],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      // tear down nock
      updateServer.done();
      t.end();
    });
  });

  // test
  tap.test('Should open webpage after deploy', t => {
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');

    // handle correct request
    const deployServer = nock('http://localhost:8080')
      .post('/deploy')
      .reply((uri, requestBody, cb) => {
        cb(null, [200, {status: 'success', deployments}]);
      });

    // execute
    deploy({open: true}).then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(deployServer.isDone());
      // make sure opn was called once
      t.ok(opnStub.calledOnce);
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['Deploying current project to endpoint:', 'http://localhost:8080'],
          ['Your project is now deployed as:\n'],
          ['   ID         URL             Hostname   \n   test       localhost       test       '],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      // tear down nock
      deployServer.done();
      t.end();
    });
  });

  // test
  tap.test('Should display error log', t => {
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');

    // handle correct request
    const deployServer = nock('http://localhost:8080')
      .post('/deploy')
      .reply((uri, requestBody, cb) => {
        cb(null, [
          400,
          {
            status: 'error',
            result: {
              error: 'Build failed! See build log for details.',
              log: ['Error log', 'here'],
              image: 'test:latest',
            },
          },
        ]);
      });

    // execute
    deploy().then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(deployServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['Deploying current project to endpoint:', 'http://localhost:8080'],
          ['Error deploying project:', 'Build failed! See build log for details.'],
          ['Build log:\n'],
          ['Error log'],
          ['here'],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      // tear down nock
      deployServer.done();
      t.end();
    });
  });

  // test
  tap.test('Should display error on malformed JSON', t => {
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
      t.ok(deployServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['Deploying current project to endpoint:', 'http://localhost:8080'],
          ['Error deploying project:', 'Bad Gateway'],
          ['Build log:\n'],
          ['No log available'],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      // tear down nock
      deployServer.done();
      t.end();
    });
  });

  // test
  tap.test('Should display verbose output', t => {
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
      t.ok(deployServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['Deploying current project to endpoint:', 'http://localhost:8080'],
          ['\nIgnoring following paths:', ['.git', 'node_modules']],
          ['Error deploying project:', 'Bad Gateway'],
          ['Build log:\n'],
          ['No log available'],
          [''],
          [
            'Original error:',
            {
              response: {
                result: {
                  error: 'Bad Gateway',
                  log: ['No log available'],
                },
              },
            },
          ],
          [
            'Original response:',
            {
              result: {
                error: 'Bad Gateway',
                log: ['No log available'],
              },
            },
          ],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      // tear down nock
      deployServer.done();
      t.end();
    });
  });

  // test
  tap.test('Should display error on zero deployments', t => {
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
      t.ok(deployServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['Deploying current project to endpoint:', 'http://localhost:8080'],
          ['Error deploying project:', 'Error: Something went wrong!'],
          ['Build log:\n'],
          ['No log available'],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      // tear down nock
      deployServer.done();
      t.end();
    });
  });

  // test
  tap.test('Should not deploy with broken config', t => {
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');

    // corrupt config with string
    fs.writeFileSync(path.join(__dirname, '..', 'exoframe.json'), 'I am broken json now');

    // execute deploy
    deploy().then(() => {
      // check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['Deploying current project to endpoint:', 'http://localhost:8080'],
          ['Please, check your config and try again:', 'SyntaxError: Unexpected token I in JSON at position 0'],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      t.end();
    });
  });

  // test
  tap.test('Should not deploy with non-existent path', t => {
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');

    // execute deploy
    deploy({_: ['i-do-not-exist']}).then(() => {
      // check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['Deploying i-do-not-exist to endpoint:', 'http://localhost:8080'],
          [`Error! Path ${path.join(process.cwd(), 'i-do-not-exist')} do not exists`],
          ['Please, check your arguments and try again.'],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      t.end();
    });
  });

  // test
  tap.test('Should deauth on 401', t => {
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
      t.ok(deployServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          [`Deploying ${folderPath} to endpoint:`, 'http://localhost:8080'],
          ['Error: authorization expired!', 'Please, relogin and try again.'],
        ],
        'Correct log output'
      );
      // check config
      t.notOk(userConfig.user, 'Should not have user');
      t.notOk(userConfig.token, 'Should not have token');
      // restore console
      console.log.restore();
      // tear down nock
      deployServer.done();
      // restore original config
      updateConfig(originalConfig);
      t.end();
    });
  });
};
