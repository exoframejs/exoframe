// npm packages
const got = require('got');
const chalk = require('chalk');

// our packages
const {userConfig, isLoggedIn, logout} = require('../config');

exports.command = ['token'];
exports.describe = 'generate new deployment token';
exports.builder = {};
exports.handler = async () => {
  if (!isLoggedIn()) {
    return;
  }

  console.log(chalk.bold('Generating new deployment token for:'), userConfig.endpoint);

  // services request url
  const remoteUrl = `${userConfig.endpoint}/deployToken`;
  // construct shared request params
  const options = {
    headers: {
      Authorization: `Bearer ${userConfig.token}`,
    },
    json: true,
  };
  // try sending request
  try {
    const {body} = await got(remoteUrl, options);
    const {token} = body;
    console.log(chalk.bold('New token generated:'));
    console.log('');
    console.log(token);
    console.log('');
    console.log(chalk.yellow('WARNING!'), 'Make sure to write it down, you will not be able to get it again!');
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.statusCode === 401) {
      logout(userConfig);
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error generating deployment token:'), e.toString());
  }
};
