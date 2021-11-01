import { expect, jest, test } from '@jest/globals';
import { html } from 'htm/react';
import { render } from 'ink-testing-library';
import nock from 'nock';
import path from 'path';
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
const ENTER = '\r';

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

  const { lastFrame, stdin } = render(html`<${Login} url=${url} />`);
  expect(lastFrame()).toMatchInlineSnapshot(`"[1mLogging into: http://test.url[22m"`);

  // wait for keys
  await setTimeout(100);
  expect(lastFrame()).toMatchInlineSnapshot(`
    "[1mLogging into: http://test.url[22m
    [1mSelect a private key to use:[22m
    [34m❯[39m [34mid_rsa[39m"
  `);

  // select key
  await setTimeout(100);
  stdin.write(ENTER);

  // wait for passphrase input
  await setTimeout(100);
  expect(lastFrame()).toMatchInlineSnapshot(`
    "[1mLogging into: http://test.url[22m
    Using key: id_rsa
    Enter key passpharse (leave blank if not set): [7m [27m"
  `);

  // use no passphrase
  await setTimeout(100);
  stdin.write(ENTER);

  // wait for username input
  await setTimeout(100);
  expect(lastFrame()).toMatchInlineSnapshot(`
    "[1mLogging into: http://test.url[22m
    Using key: id_rsa
    Enter key passpharse (leave blank if not set): [7m [27m
    Enter your username: [7m [27m"
  `);

  // enter test username
  stdin.write(username);
  await setTimeout(100);
  stdin.write(ENTER);

  // wait for username input
  await setTimeout(100);
  expect(lastFrame()).toMatchInlineSnapshot(`
    "[1mLogging into: http://test.url[22m
    Using key: id_rsa
    Using username: testUser
    Loading...
    Successfully logged in!"
  `);

  // give time to execute requests
  await setTimeout(100);

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
