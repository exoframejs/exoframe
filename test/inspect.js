// npm packages
import inquirer from 'inquirer';
import sinon from 'sinon';

// our packages
import app, {services} from './fixtures/server';
import {sleep} from './fixtures/util';
import inspect from '../src/inspect';

const serviceInfo = {
  Id: services[0].Id,
  Path: 'path',
  Args: ['args'],
  State: {
    Status: 'up',
    ExitCode: 0,
    Error: 'none',
    StartedAt: 'now',
    FinishedAt: 'never',
  },
  Name: services[0].Names[0],
  HostConfig: {
    Binds: ['/tmp:/tmp'],
    RestartPolicy: {
      Name: 'always',
    },
  },
  RestartCount: 0,
  Config: {
    Labels: {
      'test.label': '1',
    },
    Env: ['TEST_ENV=1'],
  },
  NetworkSettings: {
    Ports: {
      '8080/tcp': [{
        HostPort: '8080',
      }],
    },
  },
};

export default (test) => {
  // test
  test('Should inspect running service', (t) => {
    const serviceId = services[0].Names[0];
      // stup inquirer answer
    sinon.stub(inquirer, 'prompt', () => Promise.resolve({serviceId}));
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');

    // stub server api
    app.get('/api/inspect/:id', async (req, res) => {
      // send response
      res.send(serviceInfo);

      await sleep(100);
      // make sure log in was successful
      // first check console output
      t.deepEqual(consoleSpy.args, [
        ['Inspecting service on:', 'http://localhost:3000'],
        [],
        ['No service given, fetching list...'],
        ['Available services:'],
        ['Getting logs for:', 'test'],
        ['Service info:'],
        ['  Id: 123456789012'],
        ['  Command: path args'],
        ['  State: up'],
        ['    - Exit Code: 0'],
        ['    - Error: none'],
        ['    - Started At: Invalid Date'],
        ['    - Finished At: Invalid Date'],
        ['  Name: test'],
        ['  Restart Policy: always'],
        ['  Restart Count: 0'],
        ['  Labels:'],
        ['    - test.label: 1'],
        ['  Volumes:'],
        ['    - /tmp:/tmp'],
        ['  Environmental variables:'],
        ['    - TEST_ENV=1'],
        ['  Port mappings:'],
        ['    - Container 8080/tcp to'],
        ['      > host 8080'],
      ], 'Correct log output');
      t.equal(req.headers['x-access-token'], 'test-token-123', 'Correct token');
      t.equal(req.params.id, services[0].Id.slice(0, 12), 'Correct service ID');

      // restore console
      console.log.restore();
      // restore inquirer
      inquirer.prompt.restore();
      t.end();
    });

    // execute change
    inspect.handler({});
  });
};
