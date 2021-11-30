import { expect, jest, test } from '@jest/globals';
import { render } from 'ink-testing-library';
import nock from 'nock';
import path from 'path';
import React from 'react';
import { setTimeout } from 'timers/promises';
import { fileURLToPath } from 'url';

const baseFolder = path.dirname(fileURLToPath(import.meta.url));

jest.unstable_mockModule('os', () => {
  const fixturesDir = path.join(baseFolder, 'fixtures');
  return {
    homedir: () => fixturesDir,
  };
});

jest.unstable_mockModule('../src/config/index.js', () => {
  let config = {};

  return {
    getConfig: jest.fn(() => config),
    updateConfig: jest.fn((cfg) => {
      config = cfg;
    }),
  };
});

// import component
const { default: Login } = await import('../src/components/login/index.js');
const { getConfig, updateConfig } = await import('../src/config/index.js');

const url = 'http://test.url';
const username = 'testUser';
const INPUT_TIMEOUT = 50;
const ENTER = '\r';
const ARROW_DOWN = '\u001B[B';

test('Should login with basic input', async () => {
  // handle login request fetching
  const loginReqServer = nock(url)
    .get(`/login`)
    .reply(200, () => {
      return { phrase: 'test', uid: '123' };
    });
  // handle login execution
  const loginServer = nock(url)
    .post(`/login`)
    .reply(200, () => {
      return { token: 'test' };
    });

  const { lastFrame, stdin } = render(<Login url={url} />);
  expect(lastFrame()).toMatchInlineSnapshot(`"Logging into: http://test.url"`);

  // wait for keys
  await setTimeout(INPUT_TIMEOUT);
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Logging into: http://test.url
    Select a private key to use:
    ❯ id_rsa
      id_rsa_b
      id_rsa_keyphrase"
  `);

  // select first key
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);

  // wait for passphrase input
  await setTimeout(INPUT_TIMEOUT);
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Logging into: http://test.url
    Using key: id_rsa
    Enter key passpharse (leave blank if not set):"
  `);

  // use no passphrase
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);

  // wait for username input
  await setTimeout(INPUT_TIMEOUT);
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Logging into: http://test.url
    Using key: id_rsa
    Enter your username:"
  `);

  // enter test username
  stdin.write(username);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);

  // wait for username input
  await setTimeout(INPUT_TIMEOUT);
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Logging into: http://test.url
    Using key: id_rsa
    Using username: testUser
    Loading...
    Successfully logged in!"
  `);

  // give time to execute requests
  await setTimeout(INPUT_TIMEOUT);

  // make sure servers were actually called
  expect(loginReqServer.isDone()).toBe(true);
  expect(loginServer.isDone()).toBe(true);

  // make sure config was updated
  expect(updateConfig).toHaveBeenCalledWith({
    token: 'test',
    user: { username },
  });
  // make sure new config is correct
  expect(getConfig()).toMatchInlineSnapshot(`
    Object {
      "token": "test",
      "user": Object {
        "username": "testUser",
      },
    }
  `);
});

// test login with passphrase
test('Should login using key with passphrase', async () => {
  // handle login request fetching
  const loginReqServer = nock(url)
    .get(`/login`)
    .reply(200, () => {
      return { phrase: 'test', uid: '123' };
    });
  // handle login execution
  const loginServer = nock(url)
    .post(`/login`)
    .reply(200, () => {
      return { token: 'test' };
    });

  const { lastFrame, stdin } = render(<Login url={url} />);
  expect(lastFrame()).toMatchInlineSnapshot(`"Logging into: http://test.url"`);

  // wait for keys
  await setTimeout(INPUT_TIMEOUT);
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Logging into: http://test.url
    Select a private key to use:
    ❯ id_rsa
      id_rsa_b
      id_rsa_keyphrase"
  `);

  // select key with passphrase
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ARROW_DOWN);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ARROW_DOWN);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);

  // wait for passphrase input
  await setTimeout(INPUT_TIMEOUT);
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Logging into: http://test.url
    Using key: id_rsa_keyphrase
    Enter key passpharse (leave blank if not set):"
  `);

  // use correct test passphrase
  await setTimeout(INPUT_TIMEOUT);
  stdin.write('test123');
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);

  // wait for username input
  await setTimeout(INPUT_TIMEOUT);
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Logging into: http://test.url
    Using key: id_rsa_keyphrase
    Enter your username:"
  `);

  // enter test username
  stdin.write(username);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);

  // wait for username input
  await setTimeout(INPUT_TIMEOUT);
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Logging into: http://test.url
    Using key: id_rsa_keyphrase
    Using username: testUser
    Loading...
    Successfully logged in!"
  `);

  // give time to execute requests
  await setTimeout(INPUT_TIMEOUT);

  // make sure servers were actually called
  expect(loginReqServer.isDone()).toBe(true);
  expect(loginServer.isDone()).toBe(true);

  // make sure config was updated
  expect(updateConfig).toHaveBeenCalledWith({
    token: 'test',
    user: { username },
  });
  // make sure new config is correct
  expect(getConfig()).toMatchInlineSnapshot(`
    Object {
      "token": "test",
      "user": Object {
        "username": "testUser",
      },
    }
  `);
});

// test non-existent key file
test('Should fail to login with non-existent private key', async () => {
  // handle login request fetching
  const loginReqServer = nock(url)
    .get(`/login`)
    .reply(200, () => {
      return { phrase: 'test', uid: '123' };
    });

  const { lastFrame, stdin } = render(<Login url={url} keyPath="do_not_exist" passphrase="" />);
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Logging into: http://test.url
    Using key: do_not_exist
    Enter your username:"
  `);

  // enter test username
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(username);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);

  // wait for error
  await setTimeout(INPUT_TIMEOUT);
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Error logging in!
    Check your username and password and try again.
        Error: ENOENT: no such file or directory, open 'do_not_exist'

    "
  `);

  // make sure servers were actually called
  expect(loginReqServer.isDone()).toBe(true);
});

// test malformed private key
test('Should not login with broken private key', async () => {
  // handle login request fetching
  const loginReqServer = nock(url)
    .get(`/login`)
    .reply(200, () => {
      return { phrase: 'test', uid: '123' };
    });

  const { lastFrame, stdin } = render(<Login url={url} />);
  expect(lastFrame()).toMatchInlineSnapshot(`"Logging into: http://test.url"`);

  // wait for keys
  await setTimeout(INPUT_TIMEOUT);
  expect(lastFrame()).toMatchInlineSnapshot(`
      "Logging into: http://test.url
      Select a private key to use:
      ❯ id_rsa
        id_rsa_b
        id_rsa_keyphrase"
    `);

  // select broken key
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ARROW_DOWN);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);

  // wait for passphrase input
  await setTimeout(INPUT_TIMEOUT);
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Logging into: http://test.url
    Using key: id_rsa_b
    Enter key passpharse (leave blank if not set):"
  `);

  // use no passphrase
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);

  // wait for username input
  await setTimeout(INPUT_TIMEOUT);
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Logging into: http://test.url
    Using key: id_rsa_b
    Enter your username:"
  `);

  // enter test username
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(username);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);

  // wait for error
  await setTimeout(INPUT_TIMEOUT);
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Error logging in!
    Check your username and password and try again.
        KeyParseError: Failed to parse (unnamed) as a valid auto format key: undefined (buffer) is
    required

    "
  `);

  // make sure servers were actually called
  expect(loginReqServer.isDone()).toBe(true);
});
