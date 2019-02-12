/* eslint-env jest */
// mock config for testing
jest.mock('../src/config', () => require('./__mocks__/config'));

// npm packages
const nock = require('nock');
const sinon = require('sinon');
const inquirer = require('inquirer');

// our packages
const {handler: secrets} = require('../src/commands/secrets');
const cfg = require('../src/config');

const testSecret = {
  secretName: 'test',
  secretValue: '12345',
};

// test generation
test('Should create new secret', done => {
  // handle correct request
  const secretServer = nock('http://localhost:8080')
    .post('/secrets')
    .reply(200, {name: testSecret.secretName, value: testSecret.secretValue});
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // stup inquirer answers
  sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve(testSecret));
  // execute login
  secrets({}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(secretServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // restore inquirer
    inquirer.prompt.restore();
    // tear down nock
    secretServer.done();
    done();
  });
});

// test list
test('Should list secrets', done => {
  const createDate = new Date(2017, 1, 1, 1, 1, 1, 1);
  // handle correct request
  const secretsServer = nock('http://localhost:8080')
    .get('/secrets')
    .reply(200, {secrets: [{name: testSecret.secretName, meta: {created: createDate}}]});
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // execute login
  secrets({cmd: 'ls'}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(secretsServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args.map(lines => lines.map(l => l.replace(createDate.toLocaleString(), '')))).toMatchSnapshot();
    // restore console
    console.log.restore();
    // tear down nock
    secretsServer.done();
    done();
  });
});

// test getting
test('Should get secret value', done => {
  const createDate = new Date(2018, 1, 1, 1, 1, 1, 1);
  // handle correct request
  const secretGetServer = nock('http://localhost:8080')
    .get('/secrets')
    .reply(200, {secrets: [{name: testSecret.secretName, meta: {created: createDate}}]});
  // handle correct request
  const secretServer = nock('http://localhost:8080')
    .get(`/secrets/${testSecret.secretName}`)
    .reply(200, {secret: {...testSecret, meta: {created: createDate}}});
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // stup inquirer answers
  sinon
    .stub(inquirer, 'prompt')
    .onFirstCall()
    .callsFake(() => Promise.resolve({selectedSecret: testSecret.secretName}))
    .onSecondCall()
    .callsFake(() => Promise.resolve({doGet: true}));
  // execute login
  secrets({cmd: 'get'}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(secretGetServer.isDone()).toBeTruthy();
    expect(secretServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // restore inquirer
    inquirer.prompt.restore();
    // tear down nock
    secretGetServer.done();
    secretServer.done();
    done();
  });
});

test('Should list zero secrets', done => {
  // handle correct request
  const secretsServer = nock('http://localhost:8080')
    .get('/secrets')
    .reply(200, {secrets: []});
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // execute login
  secrets({cmd: 'ls'}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(secretsServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // tear down nock
    secretsServer.done();
    done();
  });
});

// test removal
test('Should remove secret', done => {
  const createDate = new Date();
  // handle correct request
  const secretGetServer = nock('http://localhost:8080')
    .get('/secrets')
    .reply(200, {secrets: [{name: testSecret.secretName, meta: {created: createDate}}]});
  // handle correct request
  const secretServer = nock('http://localhost:8080')
    .delete('/secrets')
    .reply(204, '');
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // stup inquirer answers
  sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve({selectedSecret: testSecret.secretName}));
  // execute login
  secrets({cmd: 'rm'}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(secretGetServer.isDone()).toBeTruthy();
    expect(secretServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // restore inquirer
    inquirer.prompt.restore();
    // tear down nock
    secretGetServer.done();
    secretServer.done();
    done();
  });
});

// test deauth
test('Should deauth on 401 on creation', done => {
  // save current config state
  cfg.__save('token');
  // handle correct request
  const secretServer = nock('http://localhost:8080')
    .post('/secrets')
    .reply(401);
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // stup inquirer answers
  sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve({secretName: 'test'}));
  // execute login
  secrets({}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(secretServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // restore inquirer
    inquirer.prompt.restore();
    // tear down nock
    secretServer.done();
    done();
  });
});

test('Should deauth on 401 on list', done => {
  // restore config with auth
  cfg.__restore('token');
  // handle correct request
  const secretServer = nock('http://localhost:8080')
    .get('/secrets')
    .reply(401);
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // stup inquirer answers
  sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve({secretName: 'test'}));
  // execute login
  secrets({cmd: 'ls'}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(secretServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // restore inquirer
    inquirer.prompt.restore();
    // tear down nock
    secretServer.done();
    done();
  });
});
