/* eslint-env jest */
// npm packages
const nock = require('nock');
const sinon = require('sinon');
const inquirer = require('inquirer');

// our packages
const {cleanLogs} = require('./util');
const {handler: update} = require('../src/commands/update');
const {userConfig, updateConfig} = require('../src/config');

// test update
test('Should update traefik', done => {
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
    expect(updateServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([['Updating traefik on:', 'http://localhost:8080'], ['Successfully updated traefik!']]);
    // restore console
    console.log.restore();
    updateServer.done();
    done();
  });
});

// test update
test('Should update server', done => {
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
    expect(updateServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([['Updating server on:', 'http://localhost:8080'], ['Successfully updated server!']]);
    // restore console
    console.log.restore();
    updateServer.done();
    done();
  });
});

// test update error
test('Should display update error', done => {
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
    expect(updateServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      ['Updating traefik on:', 'http://localhost:8080'],
      ['Error updating traefik:', 'Test error'],
      ['Update log:\n'],
      ['log'],
    ]);
    // restore console
    console.log.restore();
    updateServer.done();
    done();
  });
});

// test version check
test('Should display versions', done => {
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
    expect(updateServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      [],
      ['Exoframe Server:'],
      ['  current: 0.18.0'],
      ['  latest: 0.19.1'],
      [],
      ['Traefik:'],
      ['  current: v1.3.0'],
      ['  latest: v1.3.2'],
      [],
    ]);
    // restore console
    console.log.restore();
    // restore inquirer
    inquirer.prompt.restore();
    // cleanup server
    updateServer.done();
    done();
  });
});

// test version check
test('Should update all on user prompt', done => {
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
    expect(updateInfoServer.isDone()).toBeTruthy();
    expect(updateServerRun.isDone()).toBeTruthy();
    expect(updateTraefikRun.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
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
    ]);
    // restore console
    console.log.restore();
    // restore inquirer
    inquirer.prompt.restore();
    // cleanup server
    updateInfoServer.done();
    updateServerRun.done();
    updateTraefikRun.done();
    done();
  });
});

// test deauth
test('Should deauth on 401', done => {
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
    expect(updateServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      ['Updating traefik on:', 'http://localhost:8080'],
      ['Error: authorization expired!', 'Please, relogin and try again.'],
    ]);
    // check config
    expect(userConfig.user).toBeUndefined();
    expect(userConfig.token).toBeUndefined();
    // restore console
    console.log.restore();
    // tear down nock
    updateServer.done();
    // restore original config
    updateConfig(originalConfig);
    done();
  });
});
