// npm packages
const _ = require('lodash');
const chalk = require('chalk');
const Table = require('cli-table');

// our packages
const {tableBorder, tableStyle} = require('../config/table');
const formatServices = require('./formatServices');

module.exports = containers => {
  // populate table
  const formattedContainers = formatServices(containers);

  // create table
  const resultTable = new Table({
    head: ['ID', 'URL', 'Hostname', 'Status'],
    chars: tableBorder,
    style: tableStyle,
  });

  // whether there are any group deployments
  let hasGroupedDeployments = false;

  // group by project
  const groupedServices = _.groupBy(formattedContainers, 'project');
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
    hasGroupedDeployments = true;
    console.log(projectTable.toString());
    console.log();
  });

  // draw table
  if (resultTable.length > 0) {
    if (hasGroupedDeployments) {
      console.log(`Other deployments:`);
      console.log();
    }
    console.log(resultTable.toString());
  }
};
