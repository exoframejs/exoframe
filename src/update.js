// npm packages
import chalk from 'chalk';

// our packages
import config from './config';
import updatePlugins from './config/plugin';

export default (yargs) =>
  yargs.command('update', 'update exoframe plugins immediately', {}, () => {
    console.log(chalk.bold('Updating plugins..'));
    updatePlugins(config, {update: true});
  });
