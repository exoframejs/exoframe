// npm packages
const tap = require('tap');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const sinon = require('sinon');
const inquirer = require('inquirer');

// our packages
const {handler: config} = require('../src/commands/config');

module.exports = () => {
  const configData = {
    name: 'test',
    domain: 'test.dev',
    project: 'test-project',
    env: 'ENV=1, OTHER=2',
    hostname: 'host',
    restart: 'no',
  };
  const configPath = path.join(process.cwd(), 'exoframe.json');

  tap.test('Cleanup current config if needed', t => {
    try {
      fs.statSync(configPath);
      fs.unlinkSync(configPath);
    } catch (e) {
      // no config, just exit
    }
    t.end();
  });

  // test config generation
  tap.test('Should generate config file', t => {
    // stup inquirer answers
    sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve(configData));
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    config().then(() => {
      // first check console output
      t.deepEqual(consoleSpy.args, [['Creating new config..'], ['Config created!']], 'Correct log output');
      // then check config changes
      const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
      t.equal(cfg.name, configData.name, 'Correct name');
      t.equal(cfg.restart, configData.restart, 'Correct restart policy');
      t.equal(cfg.domain, configData.domain, 'Correct domain');
      t.equal(cfg.project, configData.project, 'Correct project');
      t.equal(cfg.hostname, configData.hostname, 'Correct hostname');
      t.equal(cfg.env.ENV, '1', 'Correct ENV var');
      t.equal(cfg.env.OTHER, '2', 'Correct OTHER var');
      // restore inquirer
      inquirer.prompt.restore();
      // restore console
      console.log.restore();
      // remove corrupted config
      fs.unlinkSync(configPath);
      t.end();
    });
  });
};
