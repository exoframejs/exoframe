// npm packages
const tap = require('tap');
const nock = require('nock');
const sinon = require('sinon');
const inquirer = require('inquirer');

// our packages
const {handler: update} = require('../src/commands/update');
const {userConfig, updateConfig} = require('../src/config');

module.exports = () => {
  // test update
  tap.test('Should update traefik', t => {
    // handle correct request
    const updateServer = nock('http://localhost:8080')
      .post('/update/traefik')
      .reply(200, {updated: true});
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

  // test update
  tap.test('Should update server', t => {
    // handle correct request
    const updateServer = nock('http://localhost:8080')
      .post('/update/server')
      .reply(200, {updated: true});
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    update({target: 'server'}).then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(updateServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [['Updating server on:', 'http://localhost:8080'], ['Successfully updated server!']],
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
    const updateServer = nock('http://localhost:8080')
      .post('/update/traefik')
      .reply(500, response);
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

  // test version check
  tap.test('Should display versions', t => {
    // handle correct request
    const response = {
      server: '0.18.0',
      latestServer: '0.19.1',
      serverUpdate: true,
      traefik: 'v1.3.0',
      latestTraefik: 'v1.3.2',
      traefikUpdate: true,
    };
    const updateServer = nock('http://localhost:8080')
      .get('/version')
      .reply(200, response);
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // stup inquirer answers
    sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve({upServer: false, upTraefik: false}));
    // execute login
    update({}).then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(updateServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          [],
          ['Exoframe Server:'],
          ['  current: 0.18.0'],
          ['  latest: 0.19.1'],
          [],
          ['Traefik:'],
          ['  current: v1.3.0'],
          ['  latest: v1.3.2'],
          [],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      // restore inquirer
      inquirer.prompt.restore();
      // cleanup server
      updateServer.done();
      t.end();
    });
  });

  // test version check
  tap.test('Should update all on user prompt', t => {
    // handle correct request
    const response = {
      server: '0.18.0',
      latestServer: '0.19.1',
      serverUpdate: true,
      traefik: 'v1.3.0',
      latestTraefik: 'v1.3.2',
      traefikUpdate: true,
    };
    const updateInfoServer = nock('http://localhost:8080')
      .get('/version')
      .reply(200, response);
    const updateServerRun = nock('http://localhost:8080')
      .post('/update/server')
      .reply(200, {updated: true});
    const updateTraefikRun = nock('http://localhost:8080')
      .post('/update/traefik')
      .reply(200, {updated: true});
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // stup inquirer answers
    sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve({upServer: true, upTraefik: true}));
    // execute login
    update({}).then(() => {
      // make sure log in was successful
      // check that servers were called
      t.ok(updateInfoServer.isDone());
      t.ok(updateServerRun.isDone());
      t.ok(updateTraefikRun.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          [],
          ['Exoframe Server:'],
          ['  current: 0.18.0'],
          ['  latest: 0.19.1'],
          [],
          ['Traefik:'],
          ['  current: v1.3.0'],
          ['  latest: v1.3.2'],
          [],
          ['Updating traefik on:', 'http://localhost:8080'],
          ['Successfully updated traefik!'],
          ['Updating server on:', 'http://localhost:8080'],
          ['Successfully updated server!'],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      // restore inquirer
      inquirer.prompt.restore();
      // cleanup server
      updateInfoServer.done();
      updateServerRun.done();
      updateTraefikRun.done();
      t.end();
    });
  });

  // test deauth
  tap.test('Should deauth on 401', t => {
    // copy original config for restoration
    const originalConfig = Object.assign({}, userConfig);
    // handle correct request
    const updateServer = nock('http://localhost:8080')
      .post(`/update/traefik`)
      .reply(401);
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
