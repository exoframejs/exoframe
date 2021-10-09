/* eslint-env jest */
// mock config for testing
jest.mock('../src/config', () => require('./__mocks__/config'));

// npm packages
import { readFileSync } from 'fs';
import getPort from 'get-port';
import { sign, verify } from 'jsonwebtoken';
import { join } from 'path';
import { auth as authConfig } from '../config.js';
import { getTokenCollection } from '../src/db/index.js';
import { startServer } from '../src/index.js';

let server;
let authToken = '';
let loginPhrase = '';
let loginReqId = '';
let deployToken = '';

// set timeout to 60s
jest.setTimeout(60000);

beforeAll(async () => {
  const port = await getPort();
  server = await startServer(port);
  return server;
});

afterAll(() => server.close());

test('Should get login id and login phrase', async (done) => {
  const options = {
    method: 'GET',
    url: '/login',
  };

  const response = await server.inject(options);
  const result = JSON.parse(response.payload);

  expect(response.statusCode).toBe(200);
  expect(response.headers['access-control-allow-origin']).toEqual('http://test.com');
  expect(result.phrase).toBeTruthy();
  expect(result.uid).toBeTruthy();

  // save phrase for login request
  loginPhrase = result.phrase;
  loginReqId = result.uid;
  done();
});

test('Should login with admin username and correct token', async (done) => {
  const privateKeyPath = join(__dirname, 'fixtures', 'id_rsa');
  const reqToken = sign(loginPhrase, readFileSync(privateKeyPath), { algorithm: 'RS256' });

  const options = {
    method: 'POST',
    url: '/login',
    payload: {
      user: { username: 'admin' },
      token: reqToken,
      requestId: loginReqId,
    },
  };

  const response = await server.inject(options);
  const result = JSON.parse(response.payload);

  expect(response.statusCode).toBe(200);
  expect(result.token).toBeTruthy();

  const decodedUser = verify(result.token, authConfig.privateKey);

  expect(decodedUser.user.username).toBe('admin');
  expect(decodedUser.loggedIn).toBeTruthy();

  // save token for return
  const { token } = result;
  authToken = token;
  done();
});

test('Should generate valid deploy token', async (done) => {
  const options = {
    method: 'POST',
    url: '/deployToken',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    payload: {
      tokenName: 'test',
    },
  };

  const response = await server.inject(options);
  const result = JSON.parse(response.payload);

  expect(response.statusCode).toBe(200);
  expect(result.token).toBeTruthy();

  const decodedUser = verify(result.token, authConfig.privateKey);

  expect(decodedUser.user.username).toBe('admin');
  expect(decodedUser.tokenName).toBe('test');
  expect(decodedUser.loggedIn).toBeTruthy();
  expect(decodedUser.deploy).toBeTruthy();

  // store for further tests
  deployToken = result.token;

  done();
});

test('Should allow request with valid deploy token', async (done) => {
  const options = {
    method: 'GET',
    url: '/checkToken',
    headers: {
      Authorization: `Bearer ${deployToken}`,
    },
  };

  const response = await server.inject(options);
  const result = JSON.parse(response.payload);

  expect(response.statusCode).toBe(200);
  expect(result.credentials).toBeTruthy();

  expect(result.message).toBe('Token is valid');
  expect(result.credentials.username).toBe('admin');

  done();
});

test('Should list generated deploy tokens', async (done) => {
  const options = {
    method: 'GET',
    url: '/deployToken',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  };

  const response = await server.inject(options);
  const result = JSON.parse(response.payload);

  expect(response.statusCode).toBe(200);
  expect(result.tokens).toBeTruthy();

  expect(result.tokens.length).toBe(1);
  expect(result.tokens[0].tokenName).toBe('test');

  done();
});

test('Should remove generated deploy tokens', async (done) => {
  const options = {
    method: 'DELETE',
    url: '/deployToken',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    payload: {
      tokenName: 'test',
    },
  };

  const response = await server.inject(options);
  expect(response.statusCode).toBe(204);

  // read tokens from DB and make sure there are none
  const tokens = getTokenCollection().find();
  expect(tokens.length).toBe(0);

  done();
});

test('Should not allow request with removed deploy token', async (done) => {
  const options = {
    method: 'GET',
    url: '/checkToken',
    headers: {
      Authorization: `Bearer ${deployToken}`,
    },
  };

  const response = await server.inject(options);
  const result = JSON.parse(response.payload);

  expect(response.statusCode).toBe(401);
  expect(result.error).toBe('Unauthorized');

  done();
});

test('Should not login without a token', async (done) => {
  const options = {
    method: 'POST',
    url: '/login',
    payload: {
      user: { username: 'admin' },
    },
  };

  const response = await server.inject(options);
  const result = JSON.parse(response.payload);

  expect(response.statusCode).toBe(401);
  expect(result.error).toBe('No token given!');

  done();
});

test('Should not login with a broken token', async (done) => {
  const options = {
    method: 'POST',
    url: '/login',
    payload: {
      user: { username: 'admin' },
      token: 'not a token',
      requestId: 'asd',
    },
  };

  const response = await server.inject(options);
  const result = JSON.parse(response.payload);

  expect(response.statusCode).toBe(401);
  expect(result.error).toBe('Login request not found!');

  done();
});
