// npm packages
const _ = require('lodash');
const got = require('got');
const chalk = require('chalk');
const Table = require('cli-table');

// our packages
const {userConfig, isLoggedIn, logout} = require('../config');
const {tableBorder, tableStyle} = require('../config/table');
const formatServices = require('../util/formatServices');

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

    // populate table
    const formattedServices = formatServices(services);

    // create table
    const resultTable = new Table({
      head: ['ID', 'URL', 'Hostname', 'Status'],
      chars: tableBorder,
      style: tableStyle,
    });

    // group by project
    const groupedServices = _.groupBy(formattedServices, 'project');
    // populate tables
    Object.keys(groupedServices).forEach(svcKey => {
      const svcList = groupedServices[svcKey];
      // if there's only one deployment in project - add it to global table
      if (svcList.length === 1) {
        const {name, domain, host, status} = svcList.pop();
        resultTable.push([name, domain, host, status]);
        return;
      }

      console.log(`Deployments for ${chalk.bold(svcKey)}:`);
      console.log();
      const projectTable = new Table({
        head: ['ID', 'URL', 'Hostname', 'Status'],
        chars: tableBorder,
        style: tableStyle,
      });
      svcList.forEach(({name, domain, host, status}) => {
        projectTable.push([name, domain, host, status]);
      });
      console.log(projectTable.toString());
      console.log();
    });

    // draw table
    if (resultTable.length > 0) {
      console.log(`Other deployments:`);
      console.log();
      console.log(resultTable.toString());
    }
  } else {
    console.log(chalk.green(`No deployments found on ${userConfig.endpoint}!`));
  }
};
