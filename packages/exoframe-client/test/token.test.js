import { createToken, listTokens, removeToken } from 'exoframe-client';
import nock from 'nock';
import { expect, test } from 'vitest';

const endpoint = 'http://localhost:8080';
const token = 'test-123';

test('Should generate token', async () => {
  // handle correct request
  const response = { token: 'test', name: 'new' };
  const tokenServer = nock(endpoint).post('/deployToken').reply(200, response);
  // execute token creation
  const result = await createToken({ name: response.name, endpoint, token });
  // make sure it was successful
  expect(result).toEqual({
    name: response.name,
    value: response.token,
  });
  // check that server was called
  expect(tokenServer.isDone()).toBeTruthy();
  // tear down nock
  tokenServer.done();
});

// test list
test('Should list tokens', async () => {
  const createDate = new Date(2017, 1, 1, 1, 1, 1, 1);
  // handle correct request
  const response = { tokens: [{ name: 'test', meta: { created: createDate.toString() } }] };
  const tokenServer = nock(endpoint).get('/deployToken').reply(200, response);
  // execute listing
  const result = await listTokens({ endpoint, token });
  // make sure it was successful
  expect(result).toEqual(response.tokens);
  // check that server was called
  expect(tokenServer.isDone()).toBeTruthy();
  // tear down nock
  tokenServer.done();
});

// test removal
test('Should remove token', async () => {
  // handle correct request
  const tokenServer = nock(endpoint).delete('/deployToken').reply(204, '');
  // execute token removal
  const result = await removeToken({ name: 'test', endpoint, token });
  // make sure it was successful
  expect(result).toBeTruthy();
  // check that server was called
  expect(tokenServer.isDone()).toBeTruthy();
  // tear down nock
  tokenServer.done();
});

// test deauth
test('Should deauth on 401 on creation', async () => {
  // handle correct request
  const tokenServer = nock(endpoint).post('/deployToken').reply(401);
  // execute creation
  try {
    await createToken({ name: 'test', endpoint, token });
  } catch (err) {
    // make sure it errored out
    expect(err).toMatchInlineSnapshot(`[Error: Authorization expired!]`);
  }
  // check that server was called
  expect(tokenServer.isDone()).toBeTruthy();
  // tear down nock
  tokenServer.done();
});

test('Should deauth on 401 on list', async () => {
  // handle correct request
  const tokenServer = nock(endpoint).get('/deployToken').reply(401);
  // execute list
  try {
    await listTokens({ endpoint, token });
  } catch (err) {
    // make sure it errored out
    expect(err).toMatchInlineSnapshot(`[Error: Authorization expired!]`);
  }
  // check that server was called
  expect(tokenServer.isDone()).toBeTruthy();
  // tear down nock
  tokenServer.done();
});
