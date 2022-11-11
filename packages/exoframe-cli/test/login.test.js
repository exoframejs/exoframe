import inquirer from 'inquirer';
import nock from 'nock';
import { join } from 'path';
import { setTimeout } from 'timers/promises';
import { afterAll, beforeEach, expect, test, vi } from 'vitest';
import { getUserConfig, setupMocks } from './util/config.js';
import { fixturesFolder } from './util/paths.js';

// setup mocks
const clearMocks = setupMocks();

// import client (has to import AFTER mocks to make mocks work)
const { generateSignature } = await import('exoframe-client');

// timeout for IO/net
const IO_TIMEOUT = 50;

// prepare test data
const token = 'test-token';
const loginRequest = { phrase: 'test', uid: '123' };
// basic private key
const privateKeyPath = join(fixturesFolder, '.ssh', 'id_rsa');
const reqToken = await generateSignature({ keyPath: privateKeyPath, loginPhrase: loginRequest.phrase });
const correctLogin = {
  user: { username: 'admin' },
  signature: reqToken.toJSON(),
  requestId: loginRequest.uid,
};
// private key with passphrase
const privateKeyPathWithPassphrase = join(fixturesFolder, '.ssh', 'id_rsa_keyphrase');
const reqTokenKey = await generateSignature({
  keyPath: privateKeyPathWithPassphrase,
  passphrase: 'test123',
  loginPhrase: loginRequest.phrase,
});
const correctLoginWithPassphrase = {
  user: { username: 'admin' },
  signature: reqTokenKey.toJSON(),
  requestId: loginRequest.uid,
};
// private key that is supposed to be disallowed
const privateKeyPathBroken = join(fixturesFolder, '.ssh', 'id_rsa_b');
const failedLogin = { user: { username: 'broken' }, signature: '', requestId: loginRequest.uid };

// handle correct request
nock('http://localhost:8080').get('/login').times(4).reply(200, loginRequest);

let program;
beforeEach(async () => {
  // import component
  const { createProgram } = await import('../src/index.js');
  program = await createProgram();
});
afterAll(() => clearMocks());

// test login
test('Should login', async () => {
  const correctLoginSrv = nock('http://localhost:8080').post('/login', correctLogin).reply(200, { token });
  // stub inquirer answers
  const inquirerSpy = vi.spyOn(inquirer, 'prompt').mockImplementationOnce(() => Promise.resolve(correctLogin.user));
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // execute login
  program.parse(['login', '--key', privateKeyPath], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(correctLoginSrv.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Logging in to:",
        "http://localhost:8080",
      ],
      [
        "Successfully logged in!",
      ],
    ]
  `);
  // then check config changes
  const cfg = await getUserConfig();
  expect(cfg.token).toEqual(token);
  expect(cfg.user.username).toEqual(correctLogin.user.username);

  // clear mocks
  consoleSpy.mockReset();
  inquirerSpy.mockReset();
});

// test login
test('Should login using key with passphrase', async () => {
  const correctLoginPassSrv = nock('http://localhost:8080')
    .post('/login', correctLoginWithPassphrase)
    .reply(200, { token });
  // stup inquirer answers
  const inquirerSpy = vi
    .spyOn(inquirer, 'prompt')
    .mockImplementationOnce(() => ({ username: correctLoginWithPassphrase.user.username }));
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // execute login
  program.parse(['login', '--key', privateKeyPathWithPassphrase, '--passphrase', 'test123'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // make sure log in was successful
  // check that server was called
  expect(correctLoginPassSrv.isDone()).toBeTruthy();
  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Logging in to:",
        "http://localhost:8080",
      ],
      [
        "Successfully logged in!",
      ],
    ]
  `);

  // then check config changes
  const cfg = await getUserConfig();
  expect(cfg.token).toEqual(token);
  expect(cfg.user.username).toEqual(correctLoginWithPassphrase.user.username);

  // restore
  inquirerSpy.mockReset();
  consoleSpy.mockReset();
});

// test wrong credentials
test('Should fail to login with broken private key', async () => {
  const wrongUser = { username: 'wrong', privateKeyName: 'i am broken', password: '' };

  // stup inquirer answers
  const inquirerSpy = vi.spyOn(inquirer, 'prompt').mockImplementationOnce(() => wrongUser);
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // execute login
  program.parse(['login', '--key', 'asd'], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Logging in to:",
        "http://localhost:8080",
      ],
      [
        "Error logging in!",
        "Error: ENOENT: no such file or directory, open 'asd'",
      ],
    ]
  `);

  // then check the config (should not change)
  const cfg = await getUserConfig();
  expect(cfg.token).toEqual(token);
  expect(cfg.user.username).toEqual(correctLogin.user.username);

  // restore
  inquirerSpy.mockReset();
  consoleSpy.mockReset();
});

// test failure
test('Should not login with broken certificate', async () => {
  // stup inquirer answers
  const inquirerSpy = vi.spyOn(inquirer, 'prompt').mockImplementationOnce(() => failedLogin.user);
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // execute login
  program.parse(['login', '--key', privateKeyPathBroken], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Logging in to:",
        "http://localhost:8080",
      ],
      [
        "Error logging in!",
        "KeyParseError: Failed to parse (unnamed) as a valid auto format key: undefined (buffer) is required",
      ],
    ]
  `);

  // then check the config (should not change)
  const cfg = await getUserConfig();
  expect(cfg.token).toEqual(token);
  expect(cfg.user.username).toEqual(correctLogin.user.username);

  // restore
  inquirerSpy.mockReset();
  consoleSpy.mockReset();
});

// test login with endpoint
test('Should login and update endpoint when endpoint was provided', async () => {
  const testEndpointUrl = 'http://my-awesome-endpoint';
  // handle login request to second test endpoint
  const correctEndpointLoginReqSrv = nock(testEndpointUrl).get('/login').reply(200, loginRequest);
  const correctEndpointLoginSrv = nock(testEndpointUrl).post('/login', correctLogin).reply(200, { token });

  // stub inquirer answers
  const inquirerSpy = vi.spyOn(inquirer, 'prompt').mockImplementationOnce(() => correctLogin.user);
  // spy on console
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // execute login
  program.parse(['login', '--key', privateKeyPath, '--url', testEndpointUrl], { from: 'user' });

  // give time to IO / net
  await setTimeout(IO_TIMEOUT);

  // first check console output
  expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Updating endpoint URL to:",
        "http://my-awesome-endpoint",
      ],
      [
        "Endpoint URL updated!",
      ],
      [
        "Logging in to:",
        "http://my-awesome-endpoint",
      ],
      [
        "Successfully logged in!",
      ],
    ]
  `);

  // make sure log in was successful
  // check that servers were called
  expect(correctEndpointLoginReqSrv.isDone()).toBeTruthy();
  expect(correctEndpointLoginSrv.isDone()).toBeTruthy();

  // then check the config (should not change)
  const cfg = await getUserConfig();
  expect(cfg.token).toEqual(token);
  expect(cfg.user.username).toEqual(correctLogin.user.username);
  expect(cfg.endpoint).toEqual(testEndpointUrl);

  // restore
  inquirerSpy.mockReset();
  consoleSpy.mockReset();
});
