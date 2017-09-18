// npm packages
const tap = require('tap');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// tests
const login = require('./login');
const remove = require('./remove');
const deploy = require('./deploy');
const logs = require('./logs');
const list = require('./list');
const config = require('./config');
const token = require('./token');
const endpoint = require('./endpoint');
const update = require('./update');

// load original config
const configPath = path.join(__dirname, 'fixtures', 'cli.config.yml');
const origCfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));

// run tests
login();
remove();
deploy();
logs();
list();
config();
token();
endpoint();
update();

// restore original config
tap.test('Restore original config', t => {
  // restore original config
  fs.writeFileSync(configPath, yaml.safeDump(origCfg), 'utf8');
  t.end();
});
