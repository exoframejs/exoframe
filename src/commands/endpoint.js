// npm packages
const chalk = require('chalk');

// our packages
const {userConfig, updateConfig} = require('../config');

exports.command = 'endpoint [url]';
exports.describe = 'get or set exoframe server URL';
exports.builder = {
  url: {
    alias: 'u',
    default: '',
  },
};
exports.handler = ({url}) => {
  const endpoint = url;
  if (!endpoint || !endpoint.length) {
    console.log(chalk.bold('Current endpoint URL:'), userConfig.endpoint);
    return;
  }

  console.log(chalk.bold('Updating endpoint URL to:'), endpoint);
  updateConfig({endpoint});
  console.log(chalk.green('Endpoint URL updated!'));
};
