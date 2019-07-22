/* eslint-env jest */
// mock config for testing
jest.mock('../src/config', () => require('./__mocks__/config'));

// npm packages
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const sinon = require('sinon');
const inquirer = require('inquirer');
const md5 = require('apache-md5');

// our packages
const {handler: config} = require('../src/commands/config');

const configData = {
  name: 'test',
  domain: 'test.dev',
  project: 'test-project',
  env: 'ENV=1, OTHER=2',
  labels: 'label=1, other=2',
  hostname: 'host',
  restart: 'no',
  template: 'static',
  enableRatelimit: true,
  ratelimitPeriod: 10,
  ratelimitAverage: 20,
  ratelimitBurst: 30,
  volumes: 'test:/volume',
  basicAuth: true,
  function: true,
  functionType: 'worker',
  functionRoute: '/test',
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
const configPath = path.join(process.cwd(), 'exoframe.json');

const verifyBasicAuth = (input, actual) => {
  actual.split(',').forEach((element, index) => {
    const hash = element.split(':')[1];
    expect(hash).toEqual(md5(input[index].password, hash));
  });
};

beforeAll(() => {
  try {
    fs.statSync(configPath);
    fs.unlinkSync(configPath);
  } catch (e) {
    // no config, just exit
  }

  sinon
    .stub(inquirer, 'prompt')
    .onFirstCall()
    .callsFake(() => Promise.resolve(configData))
    .onSecondCall()
    .callsFake(() => Promise.resolve(users[0]))
    .onThirdCall()
    .callsFake(() => Promise.resolve(users[1]));
});

test('Should generate the config with parameters', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  config({
    domain: 'test123.dev',
    restart: 'unless-stopped',
    project: 'give-project-name',
    name: 'test name 123',
    hostname: 'test123.dev',
  }).then(() => {
    expect(consoleSpy.args).toMatchSnapshot();
    // then check config changes
    const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
    expect(cfg.name).toEqual('test name 123');
    expect(cfg.restart).toEqual('unless-stopped');
    expect(cfg.domain).toEqual('test123.dev');
    expect(cfg.project).toEqual('give-project-name');
    expect(cfg.hostname).toEqual('test123.dev');
    // restore console
    console.log.restore();
    // remove corrupted config
    fs.unlinkSync(configPath);
    done();
  });
});

// test config generation
test('Should generate config file', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // execute login
  config().then(() => {
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // then check config changes
    const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
    expect(cfg.name).toEqual(configData.name);
    expect(cfg.restart).toEqual(configData.restart);
    expect(cfg.domain).toEqual(configData.domain);
    expect(cfg.project).toEqual(configData.project);
    expect(cfg.hostname).toEqual(configData.hostname);
    expect(cfg.env.ENV).toEqual('1');
    expect(cfg.env.OTHER).toEqual('2');
    expect(cfg.labels.label).toEqual('1');
    expect(cfg.labels.other).toEqual('2');
    expect(cfg.template).toEqual(configData.template);
    expect(cfg.rateLimit).toEqual({
      period: configData.ratelimitPeriod,
      average: configData.ratelimitAverage,
      burst: configData.ratelimitBurst,
    });
    expect(cfg.function).toEqual({
      type: configData.functionType,
      route: configData.functionRoute,
    });
    verifyBasicAuth(users, cfg.basicAuth);
    // restore inquirer
    inquirer.prompt.restore();
    // restore console
    console.log.restore();
    // remove corrupted config
    fs.unlinkSync(configPath);
    done();
  });
});

// test config generation
test('Should generate config file for functions', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // execute login
  config({func: true}).then(() => {
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // then check config changes
    const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
    expect(cfg.name).toEqual('exoframe-cli');
    expect(cfg.function).toEqual(true);
    // restore console
    console.log.restore();
    // remove corrupted config
    fs.unlinkSync(configPath);
    done();
  });
});
