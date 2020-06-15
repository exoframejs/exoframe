/* eslint-env jest */
import md5 from 'apache-md5';
import {createConfig, KeyValueObject, FunctionalDeploymentType, User} from '../src';

const configData = {
  name: 'test',
  domain: 'test.dev',
  port: '8080',
  project: 'test-project',
  hostname: 'host',
  restart: 'no',
  template: 'static',
  compress: true,
  letsencrypt: true,
  enableRatelimit: true,
  ratelimitAverage: 20,
  ratelimitBurst: 30,
  volumes: 'test:/volume',
};

const users: User[] = [
  {
    username: 'user1',
    password: 'pass',
  },
  {
    username: 'user2',
    password: 'pass',
  },
];

const verifyBasicAuth = (input: User[], actual: string): void => {
  actual.split(',').forEach((element, index) => {
    const hash = element.split(':')[1];
    expect(hash).toEqual(md5(input[index].password, hash));
  });
};

test('Should generate the config with parameters', () => {
  const cfg = createConfig({
    domain: 'test123.dev',
    port: '1234',
    restart: 'unless-stopped',
    project: 'give-project-name',
    name: 'test name 123',
    hostname: 'test123.dev',
  });
  // then check config changes
  expect(cfg.name).toEqual('test name 123');
  expect(cfg.restart).toEqual('unless-stopped');
  expect(cfg.domain).toEqual('test123.dev');
  expect(cfg.port).toEqual('1234');
  expect(cfg.project).toEqual('give-project-name');
  expect(cfg.hostname).toEqual('test123.dev');
});

// test config generation
test('Should generate config with extended data', () => {
  // execute login
  const env: KeyValueObject = {ENV: '1', OTHER: '2'};
  const labels: KeyValueObject = {label: '1', other: '2'};
  const cfg = createConfig({
    ...configData,
    env,
    labels,
    basicAuth: users,
  });
  // then check config changes
  expect(cfg.name).toEqual(configData.name);
  expect(cfg.restart).toEqual(configData.restart);
  expect(cfg.domain).toEqual(configData.domain);
  expect(cfg.port).toEqual(configData.port);
  expect(cfg.project).toEqual(configData.project);
  expect(cfg.hostname).toEqual(configData.hostname);
  expect(cfg.env?.ENV).toEqual('1');
  expect(cfg.env?.OTHER).toEqual('2');
  expect(cfg.labels?.label).toEqual('1');
  expect(cfg.labels?.other).toEqual('2');
  expect(cfg.template).toEqual(configData.template);
  expect(cfg.compress).toEqual(configData.compress);
  expect(cfg.letsencrypt).toEqual(configData.letsencrypt);
  expect(cfg.rateLimit).toEqual({
    average: configData.ratelimitAverage,
    burst: configData.ratelimitBurst,
  });
  verifyBasicAuth(users, cfg.basicAuth as string);
});

// test function config generation
test('Should generate functional deployment config', () => {
  // execute login
  const functionalDeployment: FunctionalDeploymentType = {
    type: 'worker',
    route: '/test',
  };
  const cfg = createConfig({
    name: 'function-test',
    project: 'function-test',
    functionalDeployment,
  });
  // then check config changes
  expect(cfg.name).toEqual('function-test');
  expect(cfg.project).toEqual('function-test');
  expect(cfg.function).toEqual(functionalDeployment);
});
