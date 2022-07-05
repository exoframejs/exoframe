import { readFileSync } from 'fs';
import getPort from 'get-port';
import jwt from 'jsonwebtoken';
import { dirname, join } from 'path';
import sshpk from 'sshpk';
import { fileURLToPath } from 'url';
import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { auth as authConfig } from '../config.js';
import { getTokenCollection } from '../src/db/index.js';

// mock config
vi.mock('../src/config/index.js', () => import('./__mocks__/config.js'));

// import server after mocking config
const { startServer } = await import('../src/index.js');

// current folder
const currentDir = dirname(fileURLToPath(import.meta.url));

const signPhraseWithKey = (phrase, keyPath) => {
  const pKey = sshpk.parsePrivateKey(readFileSync(keyPath));
  const signer = pKey.createSign('sha512');
  signer.update(phrase);
  const signature = signer.sign();
  if (pKey.type === 'ed25519') {
    return signature.toString('asn1');
  }
  return signature.toBuffer();
};

let server;
let authToken = '';
let loginPhrase = '';
let loginReqId = '';
let deployToken = '';

beforeAll(async () => {
  const port = await getPort();
  server = await startServer(port);
});

afterAll(() => server.close());

test('Should get login id and login phrase', async () => {
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
});

test('Should login with admin username and correct token (RSA)', async () => {
  const privateKeyPath = join(currentDir, 'fixtures', 'ssh-keys', 'id_rsa');
  const signature = signPhraseWithKey(loginPhrase, privateKeyPath);

  const options = {
    method: 'POST',
    url: '/login',
    payload: {
      user: { username: 'admin' },
      signature,
      requestId: loginReqId,
    },
  };

  const response = await server.inject(options);
  const result = JSON.parse(response.payload);

  expect(response.statusCode).toBe(200);
  expect(result.token).toBeTruthy();

  const decodedUser = jwt.verify(result.token, authConfig.privateKey);

  expect(decodedUser.user.username).toBe('admin');
  expect(decodedUser.loggedIn).toBeTruthy();

  // save token for return
  const { token } = result;
  authToken = token;
});

test('Should login with admin username and correct token (ECDSA)', async () => {
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
  const loginPhrase = result.phrase;
  const loginReqId = result.uid;

  // get certificate and create jwt with signed phrase
  const privateKeyPath = join(currentDir, 'fixtures', 'ssh-keys', 'id_ecdsa');
  const signature = signPhraseWithKey(loginPhrase, privateKeyPath);

  const loginOptions = {
    method: 'POST',
    url: '/login',
    payload: {
      user: { username: 'admin' },
      signature,
      requestId: loginReqId,
    },
  };

  const loginResponse = await server.inject(loginOptions);
  const loginResult = JSON.parse(loginResponse.payload);

  expect(loginResponse.statusCode).toBe(200);
  expect(loginResult.token).toBeTruthy();

  const decodedUser = jwt.verify(loginResult.token, authConfig.privateKey);

  expect(decodedUser.user.username).toBe('admin');
  expect(decodedUser.loggedIn).toBeTruthy();
});

test('Should login with admin username and correct token (ED25519)', async () => {
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
  const loginPhrase = result.phrase;
  const loginReqId = result.uid;

  // get certificate and create jwt with signed phrase
  const privateKeyPath = join(currentDir, 'fixtures', 'ssh-keys', 'id_ed25519');
  const signature = signPhraseWithKey(loginPhrase, privateKeyPath);

  const loginOptions = {
    method: 'POST',
    url: '/login',
    payload: {
      user: { username: 'admin' },
      signature,
      requestId: loginReqId,
    },
  };

  const loginResponse = await server.inject(loginOptions);
  const loginResult = JSON.parse(loginResponse.payload);

  expect(loginResponse.statusCode).toBe(200);
  expect(loginResult.token).toBeTruthy();

  const decodedUser = jwt.verify(loginResult.token, authConfig.privateKey);

  expect(decodedUser.user.username).toBe('admin');
  expect(decodedUser.loggedIn).toBeTruthy();
});

test('Should generate valid deploy token', async () => {
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

  const decodedUser = jwt.verify(result.token, authConfig.privateKey);

  expect(decodedUser.user.username).toBe('admin');
  expect(decodedUser.tokenName).toBe('test');
  expect(decodedUser.loggedIn).toBeTruthy();
  expect(decodedUser.deploy).toBeTruthy();

  // store for further tests
  deployToken = result.token;
});

test('Should allow request with valid deploy token', async () => {
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
});

test('Should list generated deploy tokens', async () => {
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
});

test('Should remove generated deploy tokens', async () => {
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
});

test('Should not allow request with removed deploy token', async () => {
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
});

test('Should not login without a signature', async () => {
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
  expect(result.error).toBe('No signature given!');
});

test('Should not login with a broken signature', async () => {
  const options = {
    method: 'POST',
    url: '/login',
    payload: {
      user: { username: 'admin' },
      signature: 'not a signature',
      requestId: 'asd',
    },
  };

  const response = await server.inject(options);
  const result = JSON.parse(response.payload);

  expect(response.statusCode).toBe(401);
  expect(result.error).toBe('Login request not found!');
});
