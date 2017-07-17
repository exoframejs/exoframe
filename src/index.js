// npm packages
const yargs = require('yargs');

// our packages
const login = require('./commands/login');
const deploy = require('./commands/deploy');
const list = require('./commands/list');
const logs = require('./commands/logs');
const remove = require('./commands/remove');
const endpoint = require('./commands/endpoint');
const config = require('./commands/config');

// init program
yargs
  .version('0.7.0')
  .completion('completion')
  .demand(1)
  .help()
  .command(deploy)
  .command(login)
  .command(endpoint)
  .command(list)
  .command(logs)
  .command(remove)
  .command(config).argv;
