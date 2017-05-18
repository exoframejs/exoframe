// npm packages
const tap = require('tap');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const nock = require('nock');
const sinon = require('sinon');
const inquirer = require('inquirer');

// our packages
const {handler: login} = require('../src/commands/login');

module.exports = () => {
  const token = 'test-token';
  const user = {username: 'admin', password: 'admin'};
  const wrongUser = {username: 'wrong', password: 'user'};
  const failedUser = {username: 'failed', password: 'user'};

  // handle correct request
  const correctLogin = nock('http://localhost:8080').post('/login', user).reply(200, {
    token,
    user,
  });
  const brokenLogin = nock('http://localhost:8080').post('/login', wrongUser).reply(401);
  const failedLogin = nock('http://localhost:8080').post('/login', failedUser).reply(200, {});

  // test login
  tap.test('Should login', t => {
    // stup inquirer answers
    sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve(user));
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    login().then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(correctLogin.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [['Logging in to:', 'http://localhost:8080'], ['Successfully logged in!']],
        'Correct log output'
      );
      // then check config changes
      const configPath = path.join(__dirname, 'fixtures', 'cli.config.yml');
      const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
      t.equal(cfg.token, token, 'Correct token');
      t.equal(cfg.user.username, user.username, 'Correct username');
      // restore inquirer
      inquirer.prompt.restore();
      // restore console
      console.log.restore();
      t.end();
    });
  });

  // test wrong credentials
  tap.test('Should fail to login with wrong credentials', t => {
    // stup inquirer answers
    sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve(wrongUser));
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    login().then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(brokenLogin.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['Logging in to:', 'http://localhost:8080'],
          ['Error logging in!', 'Check your username and password and try again.'],
        ],
        'Correct log output'
      );
      // then check the config (should not change)
      const configPath = path.join(__dirname, 'fixtures', 'cli.config.yml');
      const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
      t.equal(cfg.token, token, 'Correct token');
      t.equal(cfg.user.username, user.username, 'Correct username');
      // restore inquirer
      inquirer.prompt.restore();
      // restore console
      console.log.restore();
      t.end();
    });
  });

  // test failure
  tap.test('Should handle failure', t => {
    // stup inquirer answers
    sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve(failedUser));
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    login().then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(failedLogin.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['Logging in to:', 'http://localhost:8080'],
          ['Error logging in!', 'Check your username and password and try again.'],
        ],
        'Correct log output'
      );
      // restore inquirer
      inquirer.prompt.restore();
      // restore console
      console.log.restore();
      t.end();
    });
  });
};
