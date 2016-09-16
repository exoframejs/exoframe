// npm packages
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import inquirer from 'inquirer';
import sinon from 'sinon';

// our packages
import app from './fixtures/server';
import login from '../src/login';

export default (test) => {
  // create and user token
  const token = 'test-token-123';
  const user = {username: 'admin', password: 'admin', admin: true};

  // create login method
  app.post('/api/login', (req, res) => {
    const newUser = {...user};
    delete newUser.password;
    res.status(200).json({token, user: newUser});
  });

  // test
  test('Should login', (t) => {
    // stup inquirer answers
    sinon.stub(inquirer, 'prompt', () => Promise.resolve({username: user.username, password: user.password}));
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    login.handler().then(() => {
      // make sure log in was successful
      // first check console output
      t.deepEqual(consoleSpy.args, [
        ['Logging in to:', 'http://localhost:3000'],
        ['Successfully logged in!'],
      ], 'Correct log output');
      // then check config changes
      const configPath = path.join(__dirname, 'fixtures', 'cli.config.yml');
      const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
      t.equal(cfg.token, token, 'Correct token');
      t.equal(cfg.user.username, user.username, 'Correct username');
      t.end();
      // restore inquirer
      inquirer.prompt.restore();
      // restore console
      console.log.restore();
    });
  });
};
