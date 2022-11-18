import chalk from 'chalk';
import Table from 'cli-table3';
import { listTemplates } from 'exoframe-client';
import { getConfig, isLoggedIn, logout } from '../../config/index.js';
import { tableBorder, tableStyle } from '../../config/table.js';

export const templateListHandler = async () => {
  if (!isLoggedIn()) {
    console.log(chalk.red('Error: not logged in!'), 'Please, login and try again.');
    return;
  }

  // get user config
  const userConfig = getConfig();

  // get current endpoint and auth token
  const { endpoint, token } = userConfig;

  console.log(chalk.bold(`Listing deployment templates for:`), endpoint);

  try {
    const templates = await listTemplates({ endpoint, token });

    // if no templates - print empty message
    if (Object.keys(templates).length === 0) {
      console.log(chalk.green(`No templates found on ${endpoint}!`));
      return;
    }

    // print count
    console.log(chalk.green(`${Object.keys(templates).length} templates found on ${endpoint}:\n`));

    // create table
    const resultTable = new Table({
      head: ['Template', 'Version'],
      chars: tableBorder,
      style: tableStyle,
    });
    // fill with templates data
    Object.keys(templates).forEach((name) => resultTable.push([name, templates[name]]));
    // print result
    console.log(resultTable.toString());
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.message === 'Authorization expired!') {
      logout(userConfig);
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error listing deployment templates:'), e.toString());
  }
};
