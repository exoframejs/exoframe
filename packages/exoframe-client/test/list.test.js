import { listDeployments } from 'exoframe-client';
import nock from 'nock';
import { expect, test } from 'vitest';

const containers = [
  {
    Id: '123',
    Name: '/test',
    Config: {
      Labels: {
        'traefik.http.routers.test.rule': 'Host(`test.host`)',
        'exoframe.deployment': 'test',
        'exoframe.project': 'test',
      },
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
      Labels: { 'exoframe.project': 'test' },
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
      Labels: { 'exoframe.project': 'other' },
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
  {
    Id: '444',
    Name: '/test4',
    Config: {
      Labels: { 'exoframe.project': 'somethingelse' },
    },
    State: {
      Status: 'Up 10 minutes',
    },
    NetworkSettings: {
      Networks: {
        default: {
          Aliases: null,
        },
        traefik: {
          Aliases: ['alias4'],
        },
      },
    },
  },
];

const endpoint = 'http://localhost:8080';
const token = 'test-token';

// test list
test('Should get list of deployments', async () => {
  // handle correct request
  const listServer = nock(endpoint).get(`/list`).reply(200, { containers });
  // execute login
  const resultContainer = await listDeployments({ endpoint, token });
  // check that server was called
  expect(listServer.isDone()).toBeTruthy();
  // first check console output
  expect(resultContainer).toMatchInlineSnapshot(`
    [
      {
        "domain": "test.host",
        "host": "Not set",
        "name": "test",
        "project": "test",
        "status": "Up 10 minutes",
        "type": "Container",
      },
      {
        "domain": "Not set",
        "host": "Not set",
        "name": "test2",
        "project": "test",
        "status": "Up 12 minutes",
        "type": "Container",
      },
      {
        "domain": "Not set",
        "host": "Not set",
        "name": "test3",
        "project": "other",
        "status": "Up 13 minutes",
        "type": "Container",
      },
      {
        "domain": "Not set",
        "host": "alias4",
        "name": "test4",
        "project": "somethingelse",
        "status": "Up 10 minutes",
        "type": "Container",
      },
    ]
  `);
  // close server
  listServer.done();
});

// test list
test('Should throw error on de-auth', async () => {
  // handle correct request
  const listServer = nock(endpoint).get(`/list`).reply(401, { error: 'Auth expired' });
  // execute login
  try {
    await listDeployments({ endpoint, token });
  } catch (err) {
    expect(err).toMatchInlineSnapshot('[Error: Authorization expired!]');
  }
  // check that server was called
  expect(listServer.isDone()).toBeTruthy();
  // close server
  listServer.done();
});
