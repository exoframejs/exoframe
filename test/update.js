// npm packages
const tap = require('tap');
const nock = require('nock');
const sinon = require('sinon');

// our packages
const {handler: update} = require('../src/commands/update');
const {userConfig, updateConfig} = require('../src/config');

module.exports = () => {
  // test update
  tap.test('Should update traefik', t => {
    // handle correct request
    const updateServer = nock('http://localhost:8080').post('/update/traefik').reply(200, {updated: true});
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    update({target: 'traefik'}).then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(updateServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [['Updating traefik on:', 'http://localhost:8080'], ['Successfully updated traefik!']],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      updateServer.done();
      t.end();
    });
  });

  // test update error
  tap.test('Should display update error', t => {
    // handle correct request
    const response = {updated: false, error: 'Test error', log: 'log'};
    const updateServer = nock('http://localhost:8080').post('/update/traefik').reply(500, response);
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    update({target: 'traefik'}).then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(updateServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['Updating traefik on:', 'http://localhost:8080'],
          ['Error updating traefik:', 'Test error'],
          ['Update log:\n'],
          ['log'],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      updateServer.done();
      t.end();
    });
  });

  // test deauth
  tap.test('Should deauth on 401', t => {
    // copy original config for restoration
    const originalConfig = Object.assign({}, userConfig);
    // handle correct request
    const updateServer = nock('http://localhost:8080').post(`/update/traefik`).reply(401);
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    update({target: 'traefik'}).then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(updateServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['Updating traefik on:', 'http://localhost:8080'],
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
      updateServer.done();
      // restore original config
      updateConfig(originalConfig);
      t.end();
    });
  });
};
