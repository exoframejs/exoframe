// npm packages
import chalk from 'chalk';
import yargs from 'yargs';

// our packages
import login from './login';
import build from './build';
import list from './list';
import deploy from './deploy';
import setEndpoint from './endpoint';
import status from './status';

// init program
yargs
  .version('0.1.0')
  .completion()
  .demand(1)
  .help();

// plug commands
setEndpoint(yargs);
login(yargs);
build(yargs);
list(yargs);
deploy(yargs);
status(yargs);

// parse
yargs.argv; // eslint-disable-line

// output all uncaught exceptions
process.on('uncaughtException', err => console.error(chalk.red('Uncaught exception:'), err));
process.on('unhandledRejection', error => console.error(chalk.red('Unhandled rejection:'), error));
