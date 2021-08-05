import { expect, test } from '@jest/globals';
import { checkUpdates, executeUpdate } from 'exoframe-client';
import nock from 'nock';

const endpoint = 'http://localhost:8080';
const token = 'test-123';

test('Should update traefik', async () => {
  // handle correct request
  const response = { updated: true };
  const updateServer = nock(endpoint).post('/update/traefik').reply(200, response);
  // execute traefik update
  const result = await executeUpdate({ target: 'traefik', endpoint, token });
  // make sure it was successful
  expect(result).toEqual(response);
  // check that server was called
  expect(updateServer.isDone()).toBeTruthy();
  // teardown nock server
  updateServer.done();
});

// test update
test('Should update server', async () => {
  // handle correct request
  const response = { updated: true };
  const updateServer = nock(endpoint).post('/update/server').reply(200, response);
  // execute server update
  const result = await executeUpdate({ target: 'server', endpoint, token });
  // make sure it was successful
  expect(result).toEqual(response);
  // check that server was called
  expect(updateServer.isDone()).toBeTruthy();
  // teardown nock server
  updateServer.done();
});

test('Should throw update error', async () => {
  // handle correct request
  const response = { updated: false, error: 'Test error', log: 'log' };
  const updateServer = nock(endpoint).post('/update/traefik').reply(500, response);
  // execute update
  try {
    await executeUpdate({ target: 'traefik', endpoint, token });
  } catch (err) {
    // make sure it throws
    expect(err).toMatchInlineSnapshot(`[HTTPError: Response code 500 (Internal Server Error)]`);
    expect(err.response.body).toMatchInlineSnapshot(`
      Object {
        "error": "Test error",
        "log": "log",
        "updated": false,
      }
    `);
  }
  // check that server was called
  expect(updateServer.isDone()).toBeTruthy();
  // teardown nock server
  updateServer.done();
});

test('Should get update versions', async () => {
  // handle correct request
  const response = {
    server: '0.18.0',
    latestServer: '0.19.1',
    serverUpdate: true,
    traefik: 'v1.3.0',
    latestTraefik: 'v1.3.2',
    traefikUpdate: true,
  };
  const updateServer = nock(endpoint).get('/version').reply(200, response);
  // execute update check
  const result = await checkUpdates({ endpoint, token });
  // make sure it was successful
  expect(result).toEqual(response);
  // check that server was called
  expect(updateServer.isDone()).toBeTruthy();
  // cleanup server
  updateServer.done();
});

test('Should deauth on 401', async () => {
  // handle correct request
  const updateServer = nock(endpoint).post(`/update/traefik`).reply(401);
  // execute update
  try {
    await executeUpdate({ target: 'traefik', endpoint, token });
  } catch (err) {
    // make sure it errors out
    expect(err).toMatchInlineSnapshot(`[Error: Authorization expired!]`);
  }
  // check that server was called
  expect(updateServer.isDone()).toBeTruthy();
  // tear down nock
  updateServer.done();
});
