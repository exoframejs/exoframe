// npm packages
const yargs = require('yargs');

// version
const pkg = require('../package.json');

// our packages
const login = require('./commands/login');
const deploy = require('./commands/deploy');
const list = require('./commands/list');
const logs = require('./commands/logs');
const remove = require('./commands/remove');
const endpoint = require('./commands/endpoint');
const config = require('./commands/config');
const token = require('./commands/token');

// init program
yargs
  .version(pkg.version)
  .completion('completion')
  .demand(1)
  .help()
  .command(deploy)
  .command(login)
  .command(endpoint)
  .command(list)
  .command(logs)
  .command(remove)
  .command(token)
  .command(config).argv;
