/* eslint-env jest */
// mock config for testing
jest.mock('../src/config', () => require('./__mocks__/config'));

// npm packages
const nock = require('nock');
const sinon = require('sinon');
const inquirer = require('inquirer');

// our packages
const {handler: template} = require('../src/commands/template');
const cfg = require('../src/config');

// test generation
test('Should install new template', done => {
  // handle correct request
  const templateServer = nock('http://localhost:8080')
    .post('/templates')
    .reply(200, {success: 'true', log: ['1', '2', '3']});
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // stup inquirer answers
  sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve({templateName: 'test'}));
  // execute login
  template({}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(templateServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // restore inquirer
    inquirer.prompt.restore();
    // tear down nock
    templateServer.done();
    done();
  });
});

// test list
test('Should list templates', done => {
  // handle correct request
  const templateServer = nock('http://localhost:8080')
    .get('/templates')
    .reply(200, {template: '^0.0.1', otherTemplate: '^1.0.0'});
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // execute login
  template({cmd: 'ls'}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(templateServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // tear down nock
    templateServer.done();
    done();
  });
});

test('Should list zero templates', done => {
  // handle correct request
  const templateServer = nock('http://localhost:8080').get('/templates').reply(200, {});
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // execute login
  template({cmd: 'ls'}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(templateServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // tear down nock
    templateServer.done();
    done();
  });
});

// test removal
test('Should remove template', done => {
  // handle correct request
  const templateGetServer = nock('http://localhost:8080').get('/templates').reply(200, {testTemplate: '0.0.1'});
  // handle correct request
  const templateServer = nock('http://localhost:8080')
    .delete('/templates')
    .reply(200, {removed: true, log: ['1', '2', '3']});
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // stup inquirer answers
  sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve({rmTemplate: 'testTemplate'}));
  // execute login
  template({cmd: 'rm'}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(templateGetServer.isDone()).toBeTruthy();
    expect(templateServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // restore inquirer
    inquirer.prompt.restore();
    // tear down nock
    templateGetServer.done();
    templateServer.done();
    done();
  });
});

// test deauth
test('Should deauth on 401 on creation', done => {
  // save config for restoration
  cfg.__save('template');
  // handle correct request
  const templateServer = nock('http://localhost:8080').post('/templates').reply(401);
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // stup inquirer answers
  sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve({templateName: 'test'}));
  // execute login
  template({}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(templateServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // restore inquirer
    inquirer.prompt.restore();
    // tear down nock
    templateServer.done();
    done();
  });
});

test('Should deauth on 401 on list', done => {
  // restore original config
  cfg.__restore('template');
  // handle correct request
  const templateServer = nock('http://localhost:8080').get('/templates').reply(401);
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // stup inquirer answers
  sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve({templateName: 'test'}));
  // execute login
  template({cmd: 'ls'}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(templateServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // restore inquirer
    inquirer.prompt.restore();
    // tear down nock
    templateServer.done();
    done();
  });
});
