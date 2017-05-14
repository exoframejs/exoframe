// npm packages
const got = require('got');
const chalk = require('chalk');

// our packages
const {userConfig, isLoggedIn} = require('../config');

exports.command = 'list';
exports.describe = 'list deployments';
exports.builder = {};
exports.handler = async () => {
  if (!isLoggedIn()) {
    return;
  }

  // services request url
  const remoteUrl = `${userConfig.endpoint}/list`;
  // construct shared request params
  const options = {
    headers: {
      Authorization: `Bearer ${userConfig.token}`,
    },
    json: true,
  };
  // try sending request
  const {body: services} = await got(remoteUrl, options);
  // check for errors
  if (!services) {
    throw new Error('Server returned empty response!');
  }
  if (services.length > 0) {
    console.log(
      chalk.green(
        `${services.length} deployments found on ${userConfig.endpoint}:\n`
      )
    );
    services.forEach((svc, i) => {
      console.log(chalk.bold(`${i + 1})`), svc.Names[0].slice(1), ':');
      console.log(`  ${chalk.bold('Status')}: ${svc.Status}`);
      console.log();
    });
  } else {
    console.log(chalk.green(`No deployments found on ${userConfig.endpoint}!`));
  }
};
