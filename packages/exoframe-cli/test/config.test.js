import { expect, jest, test } from '@jest/globals';
import md5 from 'apache-md5';
import { readFile, writeFile } from 'fs/promises';
import { render } from 'ink-testing-library';
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

jest.unstable_mockModule('fs', () => {
  let config = { name: 'test' };

  return {
    promises: {
      mkdir: async () => {},
      readFile: async () => Buffer.from(JSON.stringify(config)),
      stat: async () => {},
      writeFile: async (_path, string) => {
        config = JSON.parse(string);
      },
    },
  };
});

// import component
const { default: Config } = await import('../src/components/config/index.js');

const getConfig = async () => {
  const str = await readFile('./exoframe.json');
  const cfg = JSON.parse(str);
  return cfg;
};

const resetConfig = async () => {
  await writeFile('./exoframe.json', JSON.stringify({ name: 'test' }));
};

const verifyBasicAuth = (input, actual) => {
  actual.split(',').forEach((element, index) => {
    const hash = element.split(':')[1];
    expect(hash).toEqual(md5(input[index].password, hash));
  });
};

const configData = {
  name: 'test',
  domain: 'test.dev',
  port: '8080',
  project: 'test-project',
  env: 'ENV=1, OTHER=2',
  labels: 'label=1, other=2',
  hostname: 'host',
  restart: 'always',
  template: 'static',
  dockerImage: 'test:latest',
  dockerTar: 'image.tar',
  compress: true,
  letsencrypt: true,
  ratelimitAverage: 20,
  ratelimitBurst: 30,
  volumes: 'test:/volume',
};
const users = [
  {
    username: 'user1',
    password: 'pass',
    askAgain: true,
  },
  {
    username: 'user2',
    password: 'pass',
    askAgain: false,
  },
];

const INPUT_TIMEOUT = 50;
const ENTER = '\r';
const ARROW_RIGHT = '\u001B[C';

test('Should generate config from parameters in non-interactive mode', async () => {
  const { lastFrame } = render(
    <Config
      domain="test123.dev"
      port="1234"
      restart="unless-stopped"
      project="give-project-name"
      name="test name 123"
      hostname="test123.dev"
    />
  );

  await setTimeout(INPUT_TIMEOUT);
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Mode changed to: non-interactive

    Updating domain with: test123.dev
    Updating port with: 1234
    Updating restart with: unless-stopped
    Updating project with: give-project-name
    Updating name with: test name 123
    Updating hostname with: test123.dev
    "
  `);

  const newConfig = await getConfig();
  expect(newConfig).toMatchInlineSnapshot(`
    Object {
      "domain": "test123.dev",
      "hostname": "test123.dev",
      "name": "test name 123",
      "port": "1234",
      "project": "give-project-name",
      "restart": "unless-stopped",
    }
  `);
});

// test config generation
test('Should generate config file from user input', async () => {
  resetConfig();

  const { lastFrame, stdin } = render(<Config />);

  await setTimeout(INPUT_TIMEOUT);
  expect(lastFrame()).toMatchInlineSnapshot(`
    "Config already exists! Editing..
    > Project name (required):            test
      Domain:
      Port:
      Project:
      Env variables:
      Labels:
      Volumes:
      Rate-limit average request rate
      Rate-limit burst request rate
      Hostname:
      Restart policy:
      Template:
      Compress:
      Enable letsencrypt:
      Deploy using docker image:
      Load docker image from tar file:
      Basic auth user:
      Save
    "
  `);

  // leave project name as is
  stdin.write(ENTER);
  await setTimeout(INPUT_TIMEOUT);

  // enter domain name
  stdin.write(configData.domain);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);
  await setTimeout(INPUT_TIMEOUT);

  // enter port
  stdin.write(configData.port);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);
  await setTimeout(INPUT_TIMEOUT);

  // enter project
  stdin.write(configData.project);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);
  await setTimeout(INPUT_TIMEOUT);

  // enter env variables
  stdin.write(configData.env);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);
  await setTimeout(INPUT_TIMEOUT);

  // enter labels
  stdin.write(configData.labels);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);
  await setTimeout(INPUT_TIMEOUT);

  // enter volumes
  stdin.write(configData.volumes);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);
  await setTimeout(INPUT_TIMEOUT);

  // enter rate-limit average
  stdin.write(configData.ratelimitAverage);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);
  await setTimeout(INPUT_TIMEOUT);

  // enter rate-limit burst
  stdin.write(configData.ratelimitBurst);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);
  await setTimeout(INPUT_TIMEOUT);

  // enter hostname
  stdin.write(configData.hostname);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);
  await setTimeout(INPUT_TIMEOUT);

  // select restart policy
  stdin.write(ARROW_RIGHT);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ARROW_RIGHT);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ARROW_RIGHT);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);
  await setTimeout(INPUT_TIMEOUT);

  // enter template
  stdin.write(configData.template);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);
  await setTimeout(INPUT_TIMEOUT);

  // select compress
  stdin.write(ARROW_RIGHT);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);
  await setTimeout(INPUT_TIMEOUT);

  // select letsencrypt
  stdin.write(ARROW_RIGHT);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);
  await setTimeout(INPUT_TIMEOUT);

  // enter docker image
  stdin.write(configData.dockerImage);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);
  await setTimeout(INPUT_TIMEOUT);

  // enter docker tar file
  stdin.write(configData.dockerTar);
  await setTimeout(INPUT_TIMEOUT);
  stdin.write(ENTER);
  await setTimeout(INPUT_TIMEOUT);

  // add basic auth users
  // add
  stdin.write('a');
  await setTimeout(INPUT_TIMEOUT);
  // write first username and pass
  stdin.write(`${users[0].username}:${users[0].password}`);
  await setTimeout(INPUT_TIMEOUT);
  // save it
  stdin.write(ENTER);
  await setTimeout(INPUT_TIMEOUT);
  // add another user
  stdin.write('a');
  await setTimeout(INPUT_TIMEOUT);
  // write second username and pass
  stdin.write(`${users[1].username}:${users[1].password}`);
  await setTimeout(INPUT_TIMEOUT);
  // save it
  stdin.write(ENTER);
  await setTimeout(INPUT_TIMEOUT);
  // continue to save button
  stdin.write(ENTER);
  await setTimeout(INPUT_TIMEOUT);

  // trigger save
  stdin.write(ENTER);
  await setTimeout(INPUT_TIMEOUT);

  expect(lastFrame()).toMatchInlineSnapshot(`
    "> Project name (required):            test
      Domain:                             test.dev
      Port:                               8080
      Project:                            test-project
      Env variables:                      ENV=1, OTHER=2
      Labels:                             label=1, other=2
      Volumes:                            test:/volume
      Rate-limit average request rate     20
      Rate-limit burst request rate       30
      Hostname:                           host
      Restart policy:                     always
      Template:                           static
      Compress:                           true
      Enable letsencrypt:                 true
      Deploy using docker image:          test:latest
      Load docker image from tar file:    image.tar
      Basic auth user:                    user1 user2
      Save

    Config saved!"
  `);

  // then check config changes
  const newConfig = await getConfig();
  expect(newConfig.name).toEqual(configData.name);
  expect(newConfig.restart).toEqual(configData.restart);
  expect(newConfig.domain).toEqual(configData.domain);
  expect(newConfig.port).toEqual(configData.port);
  expect(newConfig.project).toEqual(configData.project);
  expect(newConfig.hostname).toEqual(configData.hostname);
  expect(newConfig.env.ENV).toEqual('1');
  expect(newConfig.env.OTHER).toEqual('2');
  expect(newConfig.labels.label).toEqual('1');
  expect(newConfig.labels.other).toEqual('2');
  expect(newConfig.template).toEqual(configData.template);
  expect(newConfig.compress).toEqual(configData.compress);
  expect(newConfig.letsencrypt).toEqual(configData.letsencrypt);
  expect(newConfig.rateLimit).toEqual({
    average: configData.ratelimitAverage,
    burst: configData.ratelimitBurst,
  });
  verifyBasicAuth(users, newConfig.basicAuth);
});
