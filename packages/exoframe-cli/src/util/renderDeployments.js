import Table from 'cli-table3';
import { tableBorder, tableStyle } from '../config/table.js';

export const renderDeployments = (deployments) => {
  // create table
  const resultTable = new Table({
    head: ['ID', 'Deployment Name', 'URL', 'Hostname', 'Type'],
    chars: tableBorder,
    style: tableStyle,
  });

  // process deployments
  deployments.forEach(({ name, deploymentName, domain, host, type }) => {
    resultTable.push([name, deploymentName, domain, host, type]);
  });

  // draw table
  console.log(resultTable.toString());
};
