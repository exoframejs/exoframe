// npm packages
import chalk from 'chalk';

// our packages
import config from './config';

const command = 'status';
const describe = 'get exoframe status info';
const builder = {};
const handler = () => {
  console.log(chalk.green('Exoframe status:'));
  console.log(`  ${chalk.bold('Endpoint')}: ${config.endpoint}`);
  const user = config.user ?
    `${config.user.username} ${config.user.admin ? '(admin)' : ''}` :
    'Not logged in.';
  console.log(`  ${chalk.bold('User')}: ${user}`);
};

export default {
  command,
  describe,
  builder,
  handler,
};
