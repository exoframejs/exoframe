// npm packages
const got = require('got');
const chalk = require('chalk');

// our packages
const {userConfig, isLoggedIn} = require('../config');

// simplified url loader
const getUrl = async remoteUrl => {
  // construct shared request params
  const options = {
    headers: {
      Authorization: `Bearer ${userConfig.token}`,
    },
    json: true,
  };
  // try sending request
  const {body} = await got(remoteUrl, options);
  // check for errors
  if (!body) {
    throw new Error('Server returned empty response!');
  }
  return body;
};

const getServices = async () => {
  // services request url
  const remoteSvcUrl = `${userConfig.endpoint}/list`;
  // try sending request
  const services = await getUrl(remoteSvcUrl);
  console.log(services);
  return services;
};

exports.command = 'list';
exports.describe = 'list deployments';
exports.builder = {};
exports.handler = async () => {
  if (!isLoggedIn()) {
    return;
  }

  // try sending request
  const services = await getServices();
  if (services.length > 0) {
    console.log(chalk.green('Current deployments:'));
    services.forEach((svc, i) => {
      console.log(chalk.bold(`${i + 1})`), svc.Names[0], ':');
      console.log(`  ${chalk.bold('Image')}: ${svc.Image}`);
      console.log(`  ${chalk.bold('Status')}: ${svc.Status}`);
      console.log(
        `  ${chalk.bold('Template')}: ${svc.Labels['exoframe.type']}`
      );
      console.log();
    });
  } else {
    console.log(chalk.green('No deployments found!'));
  }
};
