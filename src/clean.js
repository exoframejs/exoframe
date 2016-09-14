// npm packages
import chalk from 'chalk';
import got from 'got';

// our packages
import config, {isLoggedIn} from './config';
import {handleError} from './error';

export default (yargs) =>
  yargs.command('clean', 'clean docker images on exoframe server', {}, async () => {
    if (!isLoggedIn()) {
      return;
    }

    // log header
    console.log(chalk.bold('Cleaning docker on:'), config.endpoint);
    console.log();

    // send request to remove
    const cleanUrl = `${config.endpoint}/api/clean`;
    // construct shared request params
    const options = {
      headers: {
        'x-access-token': config.token,
      },
    };
    // try sending request
    try {
      const {statusCode} = await got.post(cleanUrl, options);
      if (statusCode === 204) {
        console.log(chalk.green('Docker cleaned!'));
      } else {
        console.log(chalk.red('Error!'), 'Could not clean the docker.');
      }
    } catch (e) {
      // try generic error handling first
      if (handleError(e)) {
        return;
      }
      // log other errors
      console.log(chalk.bold('Error cleaning docker!'));
      console.error(e);
    }
  });
