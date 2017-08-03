// npm packages
const tap = require('tap');
const fs = require('fs');
const path = require('path');
const nock = require('nock');
const sinon = require('sinon');

// our packages
const {handler: deploy} = require('../src/commands/deploy');
const {userConfig, updateConfig} = require('../src/config');

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
    const deployServer = nock('http://localhost:8080').post('/deploy').reply((uri, requestBody, cb) => {
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
    const deployServer = nock('http://localhost:8080').post('/deploy').reply((uri, requestBody, cb) => {
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
    const deployServer = nock('http://localhost:8080').post('/deploy').reply((uri, requestBody, cb) => {
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
    const deployServer = nock('http://localhost:8080').post('/deploy').reply(401, {error: 'Deauth test'});
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
