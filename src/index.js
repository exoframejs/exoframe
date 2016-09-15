// npm packages
import chalk from 'chalk';
import yargs from 'yargs';

// our packages
import login from './login';
import build from './build';
import list from './list';
import deploy from './deploy';
import endpoint from './endpoint';
import status from './status';
import stop from './stop';
import start from './start';
import remove from './remove';
import pull from './pull';
import update from './update';
import logs from './logs';
import inspect from './inspect';
import removeImage from './remove-image';
import clean from './clean';

// init program
yargs // eslint-disable-line
.version('0.1.0')
.completion('completion', false)
.demand(1)
.help()
.command(build)
.command(clean)
.command(deploy)
.command(endpoint)
.command(inspect)
.command(list)
.command(login)
.command(logs)
.command(pull)
.command(remove)
.command(removeImage)
.command(start)
.command(status)
.command(stop)
.command(update)
.argv;

// output all uncaught exceptions
process.on('uncaughtException', err => console.trace(chalk.red('Uncaught exception:'), err));
process.on('unhandledRejection', error => console.trace(chalk.red('Unhandled rejection:'), error));
