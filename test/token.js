// npm packages
const tap = require('tap');
const nock = require('nock');
const sinon = require('sinon');

// our packages
const {handler: token} = require('../src/commands/token');
const {userConfig, updateConfig} = require('../src/config');

module.exports = () => {
  // test removal
  tap.test('Should generate token', t => {
    // handle correct request
    const tokenServer = nock('http://localhost:8080').get('/deployToken').reply(200, {token: 'test'});
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    token().then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(tokenServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['Generating new deployment token for:', 'http://localhost:8080'],
          ['New token generated:'],
          [''],
          ['test'],
          [''],
          ['WARNING!', 'Make sure to write it down, you will not be able to get it again!'],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      tokenServer.done();
      t.end();
    });
  });

  // test
  tap.test('Should deauth on 401', t => {
    // copy original config for restoration
    const originalConfig = Object.assign({}, userConfig);
    // handle correct request
    const tokenServer = nock('http://localhost:8080').get('/deployToken').reply(401);
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    token().then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(tokenServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['Generating new deployment token for:', 'http://localhost:8080'],
          ['Error: authorization expired!', 'Please, relogin and try again.'],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      // tear down nock
      tokenServer.done();
      // restore original config
      updateConfig(originalConfig);
      t.end();
    });
  });
};
