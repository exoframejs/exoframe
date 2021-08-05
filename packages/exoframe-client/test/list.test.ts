import { expect, test } from '@jest/globals';
import { listDeployments } from 'exoframe-client';
import nock from 'nock';

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

const services = [
  {
    ID: '12345',
    Spec: {
      Name: 'test-service-one',
      Labels: {
        'exoframe.project': 'test-service',
      },
      Networks: [
        {
          Target: 'netid',
        },
      ],
    },
  },
  {
    ID: '0987',
    Spec: {
      Name: 'test-service-two',
      Labels: {
        'exoframe.project': 'test-service',
        'exoframe.deployment': 'test-service-two',
        'traefik.http.routers.test-service-two.rule': 'Host(`test.host`)',
      },
      Networks: [
        {
          Target: 'netid',
          Aliases: ['test.host'],
        },
      ],
    },
  },
  {
    ID: '321',
    Spec: {
      Name: 'test-service-three',
      Labels: {
        'exoframe.project': 'test-project',
        'exoframe.deployment': 'test-service-three',
        'traefik.http.routers.test-service-three.rule': 'Host(`other.domain`)',
      },
      Networks: [
        {
          Target: 'netid',
        },
      ],
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
  const { containers: resultContainer } = await listDeployments({ endpoint, token });
  // check that server was called
  expect(listServer.isDone()).toBeTruthy();
  // first check console output
  expect(resultContainer).toMatchInlineSnapshot(`
    Array [
      Object {
        "domain": "test.host",
        "host": "Not set",
        "name": "test",
        "project": "test",
        "status": "Up 10 minutes",
        "type": "Container",
      },
      Object {
        "domain": "Not set",
        "host": "Not set",
        "name": "test2",
        "project": "test",
        "status": "Up 12 minutes",
        "type": "Container",
      },
      Object {
        "domain": "Not set",
        "host": "Not set",
        "name": "test3",
        "project": "other",
        "status": "Up 13 minutes",
        "type": "Container",
      },
      Object {
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

// test swarm list
test('Should get list of swarm deployments', async () => {
  // handle correct request
  const listServer = nock(endpoint).get(`/list`).reply(200, { services });
  // execute login
  const { services: resultServices } = await listDeployments({ endpoint, token });
  // make sure log in was successful
  // check that server was called
  expect(listServer.isDone()).toBeTruthy();
  // first check console output
  expect(resultServices).toMatchInlineSnapshot(`
    Array [
      Object {
        "domain": "Not set",
        "host": "Not set",
        "name": "test-service-one",
        "project": "test-service",
        "status": "",
      },
      Object {
        "domain": "test.host",
        "host": "test.host",
        "name": "test-service-two",
        "project": "test-service",
        "status": "",
      },
      Object {
        "domain": "other.domain",
        "host": "Not set",
        "name": "test-service-three",
        "project": "test-project",
        "status": "",
      },
    ]
  `);
  // close server
  listServer.done();
});
