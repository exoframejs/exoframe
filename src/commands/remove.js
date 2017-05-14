// npm packages
const got = require('got');
const chalk = require('chalk');

// our packages
const {userConfig, isLoggedIn} = require('../config');

exports.command = 'rm <id>';
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
  const {statusCode} = await got.post(remoteUrl, options);
  if (statusCode === 204) {
    console.log(chalk.green('Deployment removed!'));
  } else {
    console.log(chalk.red('Error!'), 'Could not remove the deployment.');
  }
};
