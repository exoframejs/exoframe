// npm packages
const got = require('got');
const chalk = require('chalk');

// our packages
const {userConfig, isLoggedIn, logout} = require('../config');
const renderServices = require('../util/renderServices');

exports.command = ['list', 'ls'];
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
  let containers = [];
  let services = [];
  try {
    const {body} = await got(remoteUrl, options);
    if (!body) {
      services = undefined;
      containers = undefined;
    } else {
      const {containers: userContainers, services: userServices} = body;
      containers = userContainers || [];
      services = userServices || [];
    }
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.statusCode === 401) {
      logout(userConfig);
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error while getting list:'), e.toString());
    return;
  }
  // check for errors
  if (!containers && !services) {
    throw new Error('Server returned empty response!');
  }
  if (containers.length > 0 || services.length > 0) {
    // print count
    console.log(chalk.green(`${containers.length + services.length} deployments found on ${userConfig.endpoint}:\n`));

    // render containers
    if (containers.length > 0) {
      console.log(`> ${chalk.blue.bold.underline('Normal')} deployments:\n`);
      renderServices(containers);
    }

    // render services
    if (services.length > 0) {
      console.log(`> ${chalk.blue.bold.underline('Swarm mode')} deployments:\n`);
      renderServices(services);
    }
  } else {
    console.log(chalk.green(`No deployments found on ${userConfig.endpoint}!`));
  }
};
