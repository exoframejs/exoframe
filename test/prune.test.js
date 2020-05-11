/* eslint-env jest */
// mock config for testing
jest.mock('../src/config', () => require('./__mocks__/config'));

// npm packages
const nock = require('nock');
const sinon = require('sinon');

// our packages
const {handler: system} = require('../src/commands/system');

// test update
test('Should execute prune', done => {
  // handle correct request
  const pruneServer = nock('http://localhost:8080')
    .post('/system/prune')
    .reply(200, {pruned: true, data: [{SpaceReclaimed: 1024}]});
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // execute login
  system({cmd: 'prune'}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(pruneServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    pruneServer.done();
    done();
  });
});
