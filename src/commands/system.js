// npm packages
const got = require('got');
const chalk = require('chalk');
const prettyBytes = require('pretty-bytes');

// our packages
const {userConfig, isLoggedIn, logout} = require('../config');

exports.command = ['system [cmd]'];
exports.describe = 'execute system commands (prune to remove unused data)';
exports.builder = {
  cmd: {
    default: '',
    description: 'command to execute [prune]',
  },
};
exports.handler = async args => {
  if (!isLoggedIn()) {
    return;
  }

  // get command
  const {cmd} = args;

  if (cmd !== 'prune') {
    console.log('Only "prune" command is currently supported!');
    return;
  }

  // services request url
  const remoteUrl = `${userConfig.endpoint}/system/prune`;

  // construct shared request params
  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userConfig.token}`,
    },
    responseType: 'json',
    json: {},
  };
  // try sending request
  try {
    const {body} = await got(remoteUrl, options);
    console.log(chalk.bold('Data prune successful!'));
    console.log('');
    console.log(
      chalk.bold('Reclaimed:'),
      prettyBytes(body.data.map(item => item.SpaceReclaimed).reduce((acc, val) => acc + val, 0))
    );
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.response.statusCode === 401) {
      logout(userConfig);
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red(`Error executing ${cmd} command:`), e.toString());
    console.error(e);
  }
};
