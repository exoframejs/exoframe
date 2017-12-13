/* eslint-env jest */
// npm packages
const nock = require('nock');
const sinon = require('sinon');

// our packages
const {cleanLogs} = require('./util');
const {handler: remove} = require('../src/commands/remove');
const {userConfig, updateConfig} = require('../src/config');

const id = 'test-id';

// test removal
test('Should remove', done => {
  // handle correct request
  const rmServer = nock('http://localhost:8080')
    .post(`/remove/${id}`)
    .reply(204);
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // execute login
  remove({id}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(rmServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([['Removing deployment:', id], ['Deployment removed!']]);
    // restore console
    console.log.restore();
    rmServer.done();
    done();
  });
});

// test removal error
test('Should show remove error', done => {
  // handle correct request
  const rmServer = nock('http://localhost:8080')
    .post(`/remove/${id}`)
    .reply(500);
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // execute login
  remove({id}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(rmServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      ['Removing deployment:', id],
      ['Error removing project:', 'HTTPError: Response code 500 (Internal Server Error)'],
    ]);
    // restore console
    console.log.restore();
    rmServer.done();
    done();
  });
});

// test removal error
test('Should show not found error', done => {
  // handle correct request
  const rmServer = nock('http://localhost:8080')
    .post(`/remove/${id}`)
    .reply(404);
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // execute login
  remove({id}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(rmServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      ['Removing deployment:', id],
      ['Error: container was not found!', 'Please, check deployment ID and try again.'],
    ]);
    // restore console
    console.log.restore();
    rmServer.done();
    done();
  });
});

// test removal error on incorrect success code
test('Should show not found error', done => {
  // handle correct request
  const rmServer = nock('http://localhost:8080')
    .post(`/remove/${id}`)
    .reply(200);
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // execute login
  remove({id}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(rmServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([['Removing deployment:', id], ['Error!', 'Could not remove the deployment.']]);
    // restore console
    console.log.restore();
    rmServer.done();
    done();
  });
});

// test
test('Should deauth on 401', done => {
  // copy original config for restoration
  const originalConfig = Object.assign({}, userConfig);
  // handle correct request
  const rmServer = nock('http://localhost:8080')
    .post(`/remove/${id}`)
    .reply(401);
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // execute login
  remove({id}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(rmServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      ['Removing deployment:', id],
      ['Error: authorization expired!', 'Please, relogin and try again.'],
    ]);
    // check config
    expect(userConfig.user).toBeUndefined();
    expect(userConfig.token).toBeUndefined();
    // restore console
    console.log.restore();
    // tear down nock
    rmServer.done();
    // restore original config
    updateConfig(originalConfig);
    done();
  });
});
