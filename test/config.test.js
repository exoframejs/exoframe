/* eslint-env jest */
// npm packages
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const sinon = require('sinon');
const inquirer = require('inquirer');

// our packages
const {handler: config} = require('../src/commands/config');

const configData = {
  name: 'test',
  domain: 'test.dev',
  project: 'test-project',
  env: 'ENV=1, OTHER=2',
  hostname: 'host',
  restart: 'no',
};
const configPath = path.join(process.cwd(), 'exoframe.json');

beforeAll(() => {
  try {
    fs.statSync(configPath);
    fs.unlinkSync(configPath);
  } catch (e) {
    // no config, just exit
  }
});

// test config generation
test('Should generate config file', done => {
  // stup inquirer answers
  sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve(configData));
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
    // restore inquirer
    inquirer.prompt.restore();
    // restore console
    console.log.restore();
    // remove corrupted config
    fs.unlinkSync(configPath);
    done();
  });
});
