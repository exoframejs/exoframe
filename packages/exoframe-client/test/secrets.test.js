import { expect, test } from '@jest/globals';
import nock from 'nock';
import { createSecret, getSecret, listSecrets, removeSecret } from '../index.js';

const testSecret = {
  secretName: 'test',
  secretValue: '12345',
};
const endpoint = 'http://localhost:8080';
const token = 'test-123';

test('Should create new secret', async () => {
  // handle correct request
  const secretServer = nock(endpoint)
    .post('/secrets')
    .reply(200, { name: testSecret.secretName, value: testSecret.secretValue });
  // execute secret creation
  const result = await createSecret({ name: testSecret.secretName, value: testSecret.secretValue, endpoint, token });
  // make sure creation was successful
  expect(result).toEqual({ name: testSecret.secretName, value: testSecret.secretValue });
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
    .reply(200, { secrets: [{ name: testSecret.secretName, meta: { created: createDate } }] });
  // execute secret listing
  const result = await listSecrets({ endpoint, token });
  // make sure it was successful
  expect(result).toMatchSnapshot();
  // check that server was called
  expect(secretsServer.isDone()).toBeTruthy();
  // tear down nock
  secretsServer.done();
});

test('Should get secret value', async () => {
  const createDate = new Date(2018, 1, 1, 1, 1, 1, 1);
  // handle correct request
  const secretServer = nock(endpoint)
    .get(`/secrets/${testSecret.secretName}`)
    .reply(200, { secret: { ...testSecret, meta: { created: createDate } } });
  // execute secret fetching
  const result = await getSecret({ name: testSecret.secretName, endpoint, token });
  // make sure log in was successful
  expect(result).toMatchSnapshot();
  // check that server was called
  expect(secretServer.isDone()).toBeTruthy();
  // tear down nock
  secretServer.done();
});

test('Should remove secret', async () => {
  // handle correct request
  const secretServer = nock(endpoint).delete('/secrets').reply(204, '');
  // execute secret removal
  const result = await removeSecret({ name: testSecret.secretName, endpoint, token });
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
