// npm packages
const got = require('got');
const chalk = require('chalk');
const Table = require('cli-table');

// our packages
const {userConfig, isLoggedIn, logout} = require('../config');
const {tableBorder, tableStyle} = require('../config/table');

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
  let services = [];
  try {
    const {body} = await got(remoteUrl, options);
    services = body;
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
  if (!services) {
    throw new Error('Server returned empty response!');
  }
  if (services.length > 0) {
    // print count
    console.log(chalk.green(`${services.length} deployments found on ${userConfig.endpoint}:\n`));

    // create table
    const resultTable = new Table({
      head: ['ID', 'URL', 'Hostname', 'Status'],
      chars: tableBorder,
      style: tableStyle,
    });

    // populate table
    services.forEach(svc => {
      const name = svc.Name.slice(1);
      const domain = svc.Config.Labels['traefik.frontend.rule']
        ? `http://${svc.Config.Labels['traefik.frontend.rule'].replace('Host:', '')}`
        : 'not set';
      const aliases = svc.NetworkSettings.Networks.exoframe.Aliases
        ? svc.NetworkSettings.Networks.exoframe.Aliases.filter(alias => !svc.Id.startsWith(alias))
        : [];
      const host = aliases.shift() || 'Not set';
      const status = svc.State.Status;
      resultTable.push([name, domain, host, status]);
    });

    // draw table
    console.log(resultTable.toString());
  } else {
    console.log(chalk.green(`No deployments found on ${userConfig.endpoint}!`));
  }
};
