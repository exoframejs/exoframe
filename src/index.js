// npm packages
const yargs = require('yargs');

// our packages
const login = require('./commands/login');
const deploy = require('./commands/deploy');

// init program
yargs.version('0.1.0').demand(1).help().command(deploy).command(login).argv;
