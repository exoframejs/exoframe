// npm packages
import chalk from 'chalk';

// our packages
import {updateConfig} from './config';

export default (yargs) =>
  yargs.command('endpoint <url>', 'set exoframe server URL', {
    url: {
      alias: 'u',
      default: '',
    },
  }, ({url}) => {
    const endpoint = url;
    console.log(chalk.bold('Updating endpoint URL to:'), endpoint);
    updateConfig({endpoint});
    console.log(chalk.green('Endpoint URL updated!'));
  });
