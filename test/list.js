// npm packages
const tap = require('tap');
const nock = require('nock');
const sinon = require('sinon');

// our packages
const {handler: list} = require('../src/commands/list');

module.exports = () => {
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
          ['3 deployments found on http://localhost:8080:\n'],
          ['Deployments for test:'],
          [],
          [
            '   ID          URL             Hostname       Status          \n' +
              '   test        test.host       Not set        Up 10 minutes   \n' +
              '   test2       Not set         Not set        Up 12 minutes   ',
          ],
          [],
          ['Other deployments:'],
          [],
          [
            '   ID          URL           Hostname       Status          \n' +
              '   test3       Not set       Not set        Up 13 minutes   ',
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
