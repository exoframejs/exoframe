/* eslint-env jest */
// mock config for testing
jest.mock('../src/config', () => require('./__mocks__/config'));

// npm packages
const nock = require('nock');
const sinon = require('sinon');
const inquirer = require('inquirer');

// our packages
const {handler: setup} = require('../src/commands/setup');
const cfg = require('../src/config');

// questions mock
const questions = [
  {
    type: 'input',
    name: 'test1',
    message: 'Test q1:',
  },
  {
    type: 'input',
    name: 'test2',
    message: 'Test q2:',
  },
];

// test generation
test('Should execute new setup', done => {
  // handle correct request
  const setupServerGet = nock('http://localhost:8080')
    .get('/setup')
    .query({recipeName: 'test'})
    .reply(200, {success: 'true', questions, log: ['1', '2', '3']});
  const setupServerPost = nock('http://localhost:8080')
    .post('/setup')
    .reply(200, {
      success: 'true',
      log: [{message: '1', level: 'info'}, {message: '2', level: 'info'}, {message: '3', level: 'debug'}],
    });
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // stup inquirer answers
  sinon
    .stub(inquirer, 'prompt')
    .onFirstCall()
    .callsFake(() => Promise.resolve({givenRecipeName: 'test'}))
    .onSecondCall()
    .callsFake(() => Promise.resolve({test1: 'answer1', test2: 'answer2'}));
  // execute login
  setup({}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(setupServerGet.isDone()).toBeTruthy();
    expect(setupServerPost.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // restore inquirer
    inquirer.prompt.restore();
    // tear down nock
    setupServerGet.done();
    setupServerPost.done();
    done();
  });
});

// test deauth
test('Should deauth on 401 on questions list', done => {
  // save config for restoration
  cfg.__save('template');
  // handle correct request
  const setupServer = nock('http://localhost:8080')
    .get('/setup')
    .query(true)
    .reply(401);
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // stup inquirer answers
  sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve({givenRecipeName: 'test'}));
  // execute login
  setup({}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(setupServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // restore inquirer
    inquirer.prompt.restore();
    // tear down nock
    setupServer.done();
    done();
  });
});

test('Should deauth on 401 on list', done => {
  // restore original config
  cfg.__restore('template');
  // handle correct request
  const recipeServerGet = nock('http://localhost:8080')
    .get('/setup')
    .query(true)
    .reply(200, {success: 'true', questions, log: ['1', '2', '3']});
  const recipeServerPost = nock('http://localhost:8080')
    .post('/setup')
    .reply(401);
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // stup inquirer answers
  sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve({givenRecipeName: 'test'}));
  // execute login
  setup({cmd: 'ls'}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(recipeServerGet.isDone()).toBeTruthy();
    expect(recipeServerPost.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // restore inquirer
    inquirer.prompt.restore();
    // tear down nock
    recipeServerGet.done();
    recipeServerPost.done();
    done();
  });
});
