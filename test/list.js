// npm packages
const tap = require('tap');
const nock = require('nock');
const sinon = require('sinon');
const Stream = require('stream');

// our packages
const {handler: list} = require('../src/commands/list');

module.exports = () => {
  const services = [
    {
      Names: ['/test'],
      Labels: {'traefik.frontend.rule': 'Host:test.host'},
      Status: 'Up 10 minutes',
    },
    {
      Names: ['/test2'],
      Labels: {},
      Status: 'Up 12 minutes',
    },
  ];

  // test removal
  tap.test('Should get list of deployments', t => {
    // handle correct request
    const listServer = nock('http://localhost:8080').get(`/list`).reply(200, services);
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    list().then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(listServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['2 deployments found on http://localhost:8080:\n'],
          [
            '   ID          URL                    Status          \n' +
              '   test        http://test.host       Up 10 minutes   \n' +
              '   test2       not set                Up 12 minutes   ',
          ],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      listServer.done();
      t.end();
    });
  });
};
