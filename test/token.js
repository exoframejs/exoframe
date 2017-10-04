// npm packages
const tap = require('tap');
const nock = require('nock');
const sinon = require('sinon');
const inquirer = require('inquirer');

// our packages
const {handler: token} = require('../src/commands/token');
const {userConfig, updateConfig} = require('../src/config');

module.exports = () => {
  // test generation
  tap.test('Should generate token', t => {
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
      // restore inquirer
      inquirer.prompt.restore();
      // tear down nock
      tokenServer.done();
      t.end();
    });
  });

  // test list
  tap.test('Should list tokens', t => {
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
      t.ok(tokenServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['Listing deployment tokens for:', 'http://localhost:8080'],
          ['Got generated tokens:'],
          [''],
          [`  > test [${createDate.toLocaleString()}]`],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      // tear down nock
      tokenServer.done();
      t.end();
    });
  });

  tap.test('Should list zero tokens', t => {
    const createDate = new Date();
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
      t.ok(tokenServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['Listing deployment tokens for:', 'http://localhost:8080'],
          ['Got generated tokens:'],
          [''],
          ['  > No deployment tokens available!'],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      // tear down nock
      tokenServer.done();
      t.end();
    });
  });

  // test removal
  tap.test('Should remove token', t => {
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
      t.ok(tokenGetServer.isDone());
      t.ok(tokenServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [['Removing deployment token for:', 'http://localhost:8080'], ['Deployment token successfully removed!']],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      // restore inquirer
      inquirer.prompt.restore();
      // tear down nock
      tokenGetServer.done();
      tokenServer.done();
      t.end();
    });
  });

  // test deauth
  tap.test('Should deauth on 401 on creation', t => {
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
      // restore inquirer
      inquirer.prompt.restore();
      // tear down nock
      tokenServer.done();
      // restore original config
      updateConfig(originalConfig);
      t.end();
    });
  });

  tap.test('Should deauth on 401 on list', t => {
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
      t.ok(tokenServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['Listing deployment tokens for:', 'http://localhost:8080'],
          ['Error: authorization expired!', 'Please, relogin and try again.'],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      // restore inquirer
      inquirer.prompt.restore();
      // tear down nock
      tokenServer.done();
      // restore original config
      updateConfig(originalConfig);
      t.end();
    });
  });
};
