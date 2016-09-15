// npm packages
import chalk from 'chalk';

// our packages
import {updateConfig} from './config';

const command = 'endpoint <url>';
const describe = 'set exoframe server URL';
const builder = {
  url: {
    alias: 'u',
    default: '',
  },
};
const handler = ({url}) => {
  const endpoint = url;
  console.log(chalk.bold('Updating endpoint URL to:'), endpoint);
  updateConfig({endpoint});
  console.log(chalk.green('Endpoint URL updated!'));
};

export default {
  command,
  describe,
  builder,
  handler,
};
