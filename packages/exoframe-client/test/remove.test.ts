import { expect, test } from '@jest/globals';
import { removeDeployment } from 'exoframe-client';
import nock from 'nock';

const id = 'test-id';
const url = 'test.example.com';
const endpoint = 'http://localhost:8080';
const token = 'test-123';

// test removal
test('Should remove', async () => {
  // handle correct request
  const rmServer = nock(endpoint).post(`/remove/${id}`).reply(204);
  // execute removal
  const result = await removeDeployment({ id, endpoint, token });
  // make sure it in was successful
  expect(result).toBeTruthy();
  // check that server was called
  expect(rmServer.isDone()).toBeTruthy();
  // close server
  rmServer.done();
});

test('Should remove by url', async () => {
  // handle correct request
  const rmServer = nock(endpoint).post(`/remove/${url}`).reply(204);
  // execute removal
  const result = await removeDeployment({ id: url, endpoint, token });
  // make sure it was successful
  expect(result).toBeTruthy();
  // check that server was called
  expect(rmServer.isDone()).toBeTruthy();
  // close server
  rmServer.done();
});

// test removal error
test('Should show remove error', async () => {
  // handle correct request
  const rmServer = nock(endpoint).post(`/remove/${id}`).reply(500);
  // execute removal
  try {
    await removeDeployment({ id, endpoint, token });
  } catch (err) {
    // make sure it errored out
    expect(err).toMatchInlineSnapshot(`[HTTPError: Response code 500 (Internal Server Error)]`);
  }
  // check that server was called
  expect(rmServer.isDone()).toBeTruthy();
  // close server
  rmServer.done();
});

// test removal error on incorrect success code
test('Should show not found error', async () => {
  // handle correct request
  const rmServer = nock(endpoint).post(`/remove/${id}`).reply(200);
  // execute removal
  try {
    await removeDeployment({ id, endpoint, token });
  } catch (err) {
    // make sure it errored out
    expect(err).toMatchInlineSnapshot(`[Error: Container or function was not found!]`);
  }
  // make sure log it was successful
  // check that server was called
  expect(rmServer.isDone()).toBeTruthy();
  // close server
  rmServer.done();
});

// test
test('Should deauth on 401', async () => {
  // handle correct request
  const rmServer = nock(endpoint).post(`/remove/${id}`).reply(401);
  // execute removal
  try {
    await removeDeployment({ id, endpoint, token });
  } catch (err) {
    // make sure it errored out
    expect(err).toMatchInlineSnapshot(`[Error: Authorization expired!]`);
  }
  // make sure it was successful
  // check that server was called
  expect(rmServer.isDone()).toBeTruthy();
  // close server
  rmServer.done();
});
