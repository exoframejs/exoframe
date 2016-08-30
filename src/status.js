// npm packages
import chalk from 'chalk';

// our packages
import config from './config';

export default (yargs) =>
  yargs.command('status', 'get exoframe status info', {}, () => {
    console.log(chalk.green('Exoframe status:'));
    console.log(`  ${chalk.bold('Endpoint')}: ${config.endpoint}`);
    console.log(`  ${chalk.bold('User')}: ${config.user.username} ${config.user.admin ? '(admin)' : ''}`);
  });
