// npm packages
const tap = require('tap');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const nock = require('nock');
const sinon = require('sinon');
const inquirer = require('inquirer');
const jwt = require('jsonwebtoken');

// our packages
const {handler: login} = require('../src/commands/login');

module.exports = () => {
  const token = 'test-token';
  const loginRequest = {phrase: 'test', uid: '123'};
  const privateKeyName = path.join(__dirname, 'fixtures', 'id_rsa');
  const privateKeyNameBroken = path.join(__dirname, 'fixtures', 'id_rsa_b');
  const cert = fs.readFileSync(privateKeyName);
  const certBroken = fs.readFileSync(privateKeyNameBroken);
  const reqToken = jwt.sign(loginRequest.phrase, cert, {algorithm: 'RS256'});
  const reqTokenBroken = jwt.sign(loginRequest.phrase, certBroken, {algorithm: 'RS256'});
  const correctLogin = {user: {username: 'admin'}, token: reqToken, requestId: loginRequest.uid};
  const failedLogin = {user: {username: 'broken'}, token: reqTokenBroken, requestId: loginRequest.uid};
  const wrongUser = {username: 'wrong', privateKeyName: 'i am broken', password: ''};

  // handle correct request
  nock('http://localhost:8080').get('/login').times(3).reply(200, loginRequest);
  const correctLoginSrv = nock('http://localhost:8080').post('/login', correctLogin).reply(200, {token});
  const failedLoginSrv = nock('http://localhost:8080').post('/login', failedLogin).reply(401);

  // test login
  tap.test('Should login', t => {
    // stup inquirer answers
    sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve(correctLogin.user));
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    login({key: privateKeyName}).then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(correctLoginSrv.isDone());
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
      t.equal(cfg.user.username, correctLogin.user.username, 'Correct username');
      // restore inquirer
      inquirer.prompt.restore();
      // restore console
      console.log.restore();
      t.end();
    });
  });

  // test wrong credentials
  tap.test('Should fail to login with broken private key', t => {
    // stup inquirer answers
    sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve(wrongUser));
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    login({key: 'asd'}).then(() => {
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['Logging in to:', 'http://localhost:8080'],
          ['Error logging in!', 'Error generating login token! Make sure your private key password is correct'],
        ],
        'Correct log output'
      );
      // then check the config (should not change)
      const configPath = path.join(__dirname, 'fixtures', 'cli.config.yml');
      const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
      t.equal(cfg.token, token, 'Correct token');
      t.equal(cfg.user.username, correctLogin.user.username, 'Correct username');
      // restore inquirer
      inquirer.prompt.restore();
      // restore console
      console.log.restore();
      t.end();
    });
  });

  // test failure
  tap.test('Should not login with wrong certificate', t => {
    // stup inquirer answers
    sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve(failedLogin.user));
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    login({key: privateKeyNameBroken}).then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(failedLoginSrv.isDone());
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
