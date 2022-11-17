import Table from 'cli-table3';
import { tableBorder, tableStyle } from '../config/table.js';

export const renderDeployments = (deployments) => {
  // create table
  const resultTable = new Table({
    head: ['ID', 'URL', 'Hostname', 'Type'],
    chars: tableBorder,
    style: tableStyle,
  });

  // process deployments
  deployments.forEach(({ name, domain, host, type }) => {
    resultTable.push([name, domain, host, type]);
  });

  // draw table
  console.log(resultTable.toString());
};
