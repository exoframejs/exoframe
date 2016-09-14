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
import stop from './stop';
import start from './start';
import remove from './remove';
import pull from './pull';
import update from './update';
import logs from './logs';
import inspect from './inspect';
import removeImage from './remove-image';

// init program
yargs
  .version('0.1.0')
  .completion('completion', false)
  .demand(1)
  .help();

// plug commands
setEndpoint(yargs);
login(yargs);
build(yargs);
list(yargs);
deploy(yargs);
status(yargs);
stop(yargs);
start(yargs);
remove(yargs);
pull(yargs);
update(yargs);
logs(yargs);
inspect(yargs);
removeImage(yargs);

// parse
yargs.argv; // eslint-disable-line

// output all uncaught exceptions
process.on('uncaughtException', err => console.trace(chalk.red('Uncaught exception:'), err));
process.on('unhandledRejection', error => console.trace(chalk.red('Unhandled rejection:'), error));
