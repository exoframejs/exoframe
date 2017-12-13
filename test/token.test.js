/* eslint-env jest */
// npm packages
const nock = require('nock');
const sinon = require('sinon');
const inquirer = require('inquirer');

// our packages
const {cleanLogs} = require('./util');
const {handler: token} = require('../src/commands/token');
const {userConfig, updateConfig} = require('../src/config');

// test generation
test('Should generate token', done => {
  // handle correct request
  const tokenServer = nock('http://localhost:8080')
    .post('/deployToken')
    .reply(200, {token: 'test'});
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // stup inquirer answers
  sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve({tokenName: 'test'}));
  // execute login
  token({}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(tokenServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      ['Generating new deployment token for:', 'http://localhost:8080'],
      ['New token generated:'],
      [''],
      ['test'],
      [''],
      ['WARNING!', 'Make sure to write it down, you will not be able to get it again!'],
    ]);
    // restore console
    console.log.restore();
    // restore inquirer
    inquirer.prompt.restore();
    // tear down nock
    tokenServer.done();
    done();
  });
});

// test list
test('Should list tokens', done => {
  const createDate = new Date();
  // handle correct request
  const tokenServer = nock('http://localhost:8080')
    .get('/deployToken')
    .reply(200, {tokens: [{tokenName: 'test', meta: {created: createDate}}]});
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // execute login
  token({cmd: 'ls'}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(tokenServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      ['Listing deployment tokens for:', 'http://localhost:8080'],
      ['Got generated tokens:'],
      [''],
      [`  > test [${createDate.toLocaleString()}]`],
    ]);
    // restore console
    console.log.restore();
    // tear down nock
    tokenServer.done();
    done();
  });
});

test('Should list zero tokens', done => {
  // handle correct request
  const tokenServer = nock('http://localhost:8080')
    .get('/deployToken')
    .reply(200, {tokens: []});
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // execute login
  token({cmd: 'ls'}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(tokenServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      ['Listing deployment tokens for:', 'http://localhost:8080'],
      ['Got generated tokens:'],
      [''],
      ['  > No deployment tokens available!'],
    ]);
    // restore console
    console.log.restore();
    // tear down nock
    tokenServer.done();
    done();
  });
});

// test removal
test('Should remove token', done => {
  const createDate = new Date();
  // handle correct request
  const tokenGetServer = nock('http://localhost:8080')
    .get('/deployToken')
    .reply(200, {tokens: [{tokenName: 'test', meta: {created: createDate}}]});
  // handle correct request
  const tokenServer = nock('http://localhost:8080')
    .delete('/deployToken')
    .reply(204, '');
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // stup inquirer answers
  sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve({rmToken: 'test'}));
  // execute login
  token({cmd: 'rm'}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(tokenGetServer.isDone()).toBeTruthy();
    expect(tokenServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      ['Removing deployment token for:', 'http://localhost:8080'],
      ['Deployment token successfully removed!'],
    ]);
    // restore console
    console.log.restore();
    // restore inquirer
    inquirer.prompt.restore();
    // tear down nock
    tokenGetServer.done();
    tokenServer.done();
    done();
  });
});

// test deauth
test('Should deauth on 401 on creation', done => {
  // copy original config for restoration
  const originalConfig = Object.assign({}, userConfig);
  // handle correct request
  const tokenServer = nock('http://localhost:8080')
    .post('/deployToken')
    .reply(401);
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // stup inquirer answers
  sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve({tokenName: 'test'}));
  // execute login
  token({}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(tokenServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      ['Generating new deployment token for:', 'http://localhost:8080'],
      ['Error: authorization expired!', 'Please, relogin and try again.'],
    ]);
    // restore console
    console.log.restore();
    // restore inquirer
    inquirer.prompt.restore();
    // tear down nock
    tokenServer.done();
    // restore original config
    updateConfig(originalConfig);
    done();
  });
});

test('Should deauth on 401 on list', done => {
  // copy original config for restoration
  const originalConfig = Object.assign({}, userConfig);
  // handle correct request
  const tokenServer = nock('http://localhost:8080')
    .get('/deployToken')
    .reply(401);
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // stup inquirer answers
  sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve({tokenName: 'test'}));
  // execute login
  token({cmd: 'ls'}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(tokenServer.isDone()).toBeTruthy();
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      ['Listing deployment tokens for:', 'http://localhost:8080'],
      ['Error: authorization expired!', 'Please, relogin and try again.'],
    ]);
    // restore console
    console.log.restore();
    // restore inquirer
    inquirer.prompt.restore();
    // tear down nock
    tokenServer.done();
    // restore original config
    updateConfig(originalConfig);
    done();
  });
});
