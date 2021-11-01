import { expect, test } from '@jest/globals';
import { executeLogin, generateSignature, getLoginRequest, loginWithLoginRequest } from 'exoframe-client';
import nock from 'nock';
import path from 'path';
import { fileURLToPath } from 'url';

const baseFolder = path.dirname(fileURLToPath(import.meta.url));
const endpoint = 'http://localhost:8080';
const loginRequest = { phrase: 'test', uid: '123' };
const username = 'testUser';
const keyPath = path.join(baseFolder, 'fixtures', 'ssh-keys', 'id_rsa');
const token = 'test-123';
const signature = await generateSignature({ keyPath, loginPhrase: loginRequest.phrase });

// test login request fetching
test('Should get login request', async () => {
  // handle correct request
  const loginServer = nock(endpoint)
    .get(`/login`)
    .reply(200, () => {
      return loginRequest;
    });
  // get login request
  const response = await getLoginRequest({ endpoint });
  // make sure log in was successful
  // check that server was called
  expect(loginServer.isDone()).toBeTruthy();
  // make sure logs are correct
  expect(response).toMatchObject({
    phrase: loginRequest.phrase,
    loginReqId: loginRequest.uid,
  });
});

// test login with given request
test('Should execute login with given login request', async () => {
  // handle correct request
  const loginServer = nock(endpoint)
    .post(`/login`)
    .reply(200, (_uri, requestBody) => {
      expect(requestBody.user.username).toEqual(username);
      expect(requestBody.requestId).toEqual(loginRequest.uid);
      expect(JSON.stringify(requestBody.signature)).toEqual(JSON.stringify(signature));
      return { token };
    });

  const response = await loginWithLoginRequest({
    endpoint,
    keyPath,
    username,
    loginRequest: {
      phrase: loginRequest.phrase,
      loginReqId: loginRequest.uid,
    },
  });
  // make sure log in was successful
  // check that server was called
  expect(loginServer.isDone()).toBeTruthy();
  // make sure logs are correct
  expect(response).toMatchObject({ token });
});

// test full login procedure
test('Should execute full login procedure', async () => {
  // handle login request fetching
  const loginReqServer = nock(endpoint)
    .get(`/login`)
    .reply(200, () => {
      return loginRequest;
    });
  // handle login execution
  const loginServer = nock(endpoint)
    .post(`/login`)
    .reply(200, (_uri, requestBody) => {
      expect(requestBody.user.username).toEqual(username);
      expect(requestBody.requestId).toEqual(loginRequest.uid);
      expect(JSON.stringify(requestBody.signature)).toEqual(JSON.stringify(signature));
      return { token };
    });

  const response = await executeLogin({ endpoint, keyPath, username });
  // make sure log in was successful
  // check that server was called
  expect(loginReqServer.isDone()).toBeTruthy();
  expect(loginServer.isDone()).toBeTruthy();
  // make sure logs are correct
  expect(response).toMatchObject({ token });
});
