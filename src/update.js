// npm packages
import chalk from 'chalk';

// our packages
import config from './config';
import updatePlugins from './config/plugin';

const command = 'update';
const describe = 'update exoframe plugins immediately';
const builder = {};
const handler = () => {
  console.log(chalk.bold('Updating plugins..'));
  updatePlugins(config, {update: true});
};

export default {
  command,
  describe,
  builder,
  handler,
};
