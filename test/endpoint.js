// npm packages
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import sinon from 'sinon';

// our packages
import endpoint from '../src/endpoint';

export default (test) => {
  // test
  test('Should change endpoint URL', (t) => {
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    const url = 'http://test.endpoint.url';
    // execute change
    endpoint.handler({url});
    // make sure log in was successful
    // first check console output
    t.deepEqual(consoleSpy.args, [
      ['Updating endpoint URL to:', url],
      ['Endpoint URL updated!'],
    ], 'Correct log output');
    // then check config changes
    const configPath = path.join(__dirname, 'fixtures', 'cli.config.yml');
    const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
    t.equal(cfg.endpoint, url, 'Correct url');
    // restore console
    console.log.restore();
    t.end();
  });

  test('Restore endpoint URL', (t) => {
    const url = 'http://localhost:3000';
    // change back
    endpoint.handler({url});
    // then check config changes
    const configPath = path.join(__dirname, 'fixtures', 'cli.config.yml');
    const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
    t.equal(cfg.endpoint, url, 'Correct url');
    t.end();
  });
};
