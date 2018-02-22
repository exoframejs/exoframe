/* eslint-env jest */
// mock config for testing
jest.mock('../src/config', () => require('./__mocks__/config'));

// npm packages
const nock = require('nock');
const sinon = require('sinon');

// our packages
const {handler: list} = require('../src/commands/list');

const services = [
  {
    Id: '123',
    Name: '/test',
    Config: {
      Labels: {'traefik.frontend.rule': 'Host:test.host', 'exoframe.project': 'test'},
    },
    State: {
      Status: 'Up 10 minutes',
    },
    NetworkSettings: {
      Networks: {
        exoframe: {
          Aliases: null,
        },
      },
    },
  },
  {
    Id: '321',
    Name: '/test2',
    Config: {
      Labels: {'exoframe.project': 'test'},
    },
    State: {
      Status: 'Up 12 minutes',
    },
    NetworkSettings: {
      Networks: {
        exoframe: {
          Aliases: null,
        },
      },
    },
  },
  {
    Id: '111',
    Name: '/test3',
    Config: {
      Labels: {'exoframe.project': 'other'},
    },
    State: {
      Status: 'Up 13 minutes',
    },
    NetworkSettings: {
      Networks: {
        exoframe: {
          Aliases: null,
        },
      },
    },
  },
];

// test removal
test('Should get list of deployments', done => {
  // handle correct request
  const listServer = nock('http://localhost:8080')
    .get(`/list`)
    .reply(200, services);
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // execute login
  list().then(() => {
    // make sure log in was successful
    // check that server was called
    expect(listServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    listServer.done();
    done();
  });
});
