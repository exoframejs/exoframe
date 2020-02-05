// npm packages
const got = require('got');
const chalk = require('chalk');

// our packages
const {userConfig, isLoggedIn, logout} = require('../config');

exports.command = ['remove <id>', 'rm <id>'];
exports.describe = 'remove active deployment';
exports.builder = {
  token: {
    alias: 't',
    description: 'Deployment token to be used for authentication',
  },
};
exports.handler = async (args = {}) => {
  const deployToken = args.token;
  const id = args.id;

  if (!deployToken && !isLoggedIn()) {
    console.log(chalk.red('Error!'), '\nYou need to sign in first or supply a authentication token.');
    return;
  }

  console.log(chalk.bold('Removing deployment:'), id);

  // services request url
  const remoteUrl = `${userConfig.endpoint}/remove/${encodeURIComponent(id)}`;
  let authToken = userConfig.token;

  if (deployToken) {
    authToken = deployToken;
    console.log('\nRemoving using given token..');
  }
  // construct shared request params
  const options = {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    json: {},
  };
  // try sending request
  try {
    const {statusCode} = await got.post(remoteUrl, options);
    if (statusCode === 204) {
      console.log(chalk.green('Deployment removed!'));
    } else {
      console.log(chalk.red('Error!'), 'Could not remove the deployment.');
    }
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.response.statusCode === 401) {
      logout(userConfig);
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    // if container was not found
    if (e.response.statusCode === 404) {
      console.log(
        chalk.red('Error: container or function was not found!'),
        'Please, check deployment ID and try again.'
      );
      return;
    }

    console.log(chalk.red('Error removing project:'), e.toString());
  }
};
