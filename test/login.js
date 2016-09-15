// npm packages
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import inquirer from 'inquirer';
import sinon from 'sinon';

// our packages
import login from '../src/login';

export default (test) => {
  test('Should login', (t) => {
    // stup inquirer answers
    sinon.stub(inquirer, 'prompt', () => Promise.resolve({username: 'admin', password: 'admin'}));
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    login.handler().then(() => {
      // make sure log in was successful
      // first check console output
      t.deepEqual(consoleSpy.args, [
        ['\x1b[1mLogging in to:\x1b[22m', 'http://localhost:3000'],
        ['\x1b[32mSuccessfully logged in!\x1b[39m'],
      ], 'Correct log output');
      // then check config changes
      const configPath = path.join(__dirname, 'fixtures', 'cli.config.yml');
      const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
      t.equal(cfg.token, 'test-token-123', 'Correct token');
      t.equal(cfg.user.username, 'admin', 'Correct username');
      t.end();
      // restore inquirer
      inquirer.prompt.restore();
      // restore console
      console.log.restore();
    });
  });
};
