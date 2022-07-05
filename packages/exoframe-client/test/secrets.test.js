import { createSecret, getSecret, listSecrets, removeSecret } from 'exoframe-client';
import nock from 'nock';
import { expect, test } from 'vitest';

const testSecret = {
  name: 'test',
  value: '12345',
};
const endpoint = 'http://localhost:8080';
const token = 'test-123';

test('Should create new secret', async () => {
  // handle correct request
  const response = { name: testSecret.name, value: testSecret.value };
  const secretServer = nock(endpoint).post('/secrets').reply(200, response);
  // execute secret creation
  const result = await createSecret({ name: testSecret.name, value: testSecret.value, endpoint, token });
  // make sure creation was successful
  expect(result).toEqual(response);
  // check that server was called
  expect(secretServer.isDone()).toBeTruthy();
  // tear down nock
  secretServer.done();
});

test('Should list secrets', async () => {
  const createDate = new Date(2017, 1, 1, 1, 1, 1, 1);
  // handle correct request
  const secretsServer = nock(endpoint)
    .get('/secrets')
    .reply(200, { secrets: [{ name: testSecret.name, meta: { created: createDate } }] });
  // execute secret listing
  const result = await listSecrets({ endpoint, token });
  // make sure it was successful
  expect(result).toMatchInlineSnapshot(`
    [
      {
        "meta": {
          "created": "2017-02-01T01:01:01.001Z",
        },
        "name": "test",
      },
    ]
  `);
  // check that server was called
  expect(secretsServer.isDone()).toBeTruthy();
  // tear down nock
  secretsServer.done();
});

test('Should get secret value', async () => {
  const createDate = new Date(2018, 1, 1, 1, 1, 1, 1);
  // handle correct request
  const secretServer = nock(endpoint)
    .get(`/secrets/${testSecret.name}`)
    .reply(200, { secret: { ...testSecret, meta: { created: createDate } } });
  // execute secret fetching
  const result = await getSecret({ name: testSecret.name, endpoint, token });
  // make sure log in was successful
  expect(result).toMatchInlineSnapshot(`
    {
      "meta": {
        "created": "2018-02-01T01:01:01.001Z",
      },
      "name": "test",
      "value": "12345",
    }
  `);
  // check that server was called
  expect(secretServer.isDone()).toBeTruthy();
  // tear down nock
  secretServer.done();
});

test('Should remove secret', async () => {
  // handle correct request
  const secretServer = nock(endpoint).delete('/secrets').reply(204, '');
  // execute secret removal
  const result = await removeSecret({ name: testSecret.name, endpoint, token });
  // make sure it was successful
  expect(result).toBeTruthy();
  // check that server was called
  expect(secretServer.isDone()).toBeTruthy();
  // tear down nock
  secretServer.done();
});

test('Should deauth on 401 on creation', async () => {
  // handle correct request
  const secretServer = nock(endpoint).post('/secrets').reply(401);
  // execute secret creation
  try {
    await createSecret({ name: '1', value: '1', endpoint, token });
  } catch (err) {
    // make sure it errored out
    expect(err).toMatchInlineSnapshot(`[Error: Authorization expired!]`);
  }
  // check that server was called
  expect(secretServer.isDone()).toBeTruthy();
  // tear down nock
  secretServer.done();
});

test('Should deauth on 401 on list', async () => {
  // handle correct request
  const secretServer = nock(endpoint).get('/secrets').reply(401);
  // execute secret listing
  try {
    await listSecrets({ endpoint, token });
  } catch (err) {
    // make sure it errored out
    expect(err).toMatchInlineSnapshot(`[Error: Authorization expired!]`);
  }
  // check that server was called
  expect(secretServer.isDone()).toBeTruthy();
  // tear down nock
  secretServer.done();
});
