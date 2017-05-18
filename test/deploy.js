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

      cb(null, [200, {status: 'success', names: ['test']}]);
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
          ['Done!', 'Your project is now deployed as:\n  > test'],
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
      cb(null, [200, {status: 'success', names: ['test']}]);
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
          ['Done!', 'Your project is now deployed as:\n  > test'],
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
