// npm packages
const got = require('got');
const chalk = require('chalk');

// our packages
const {userConfig, isLoggedIn, logout} = require('../config');

exports.command = ['remove <id>', 'rm <id>'];
exports.describe = 'remove active deployment';
exports.builder = {};
exports.handler = async ({id}) => {
  if (!isLoggedIn()) {
    return;
  }

  console.log(chalk.bold('Removing deployment:'), id);

  // services request url
  const remoteUrl = `${userConfig.endpoint}/remove/${encodeURIComponent(id)}`;
  // construct shared request params
  const options = {
    headers: {
      Authorization: `Bearer ${userConfig.token}`,
    },
    json: true,
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
    if (e.statusCode === 401) {
      logout(userConfig);
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error removing project:'), e.toString());
  }
};
