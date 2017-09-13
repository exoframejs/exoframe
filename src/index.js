// npm packages
const yargs = require('yargs');

// our packages
const checkUpdate = require('./util/checkUpdate');

// version
const pkg = require('../package.json');

// check for updates on start
checkUpdate(pkg);

// our packages
const login = require('./commands/login');
const deploy = require('./commands/deploy');
const list = require('./commands/list');
const logs = require('./commands/logs');
const remove = require('./commands/remove');
const endpoint = require('./commands/endpoint');
const config = require('./commands/config');
const token = require('./commands/token');
const update = require('./commands/update');

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
  .command(config)
  .command(update).argv;
