import chalk from 'chalk';
import Table from 'cli-table3';
import { deploy as deployExo } from 'exoframe-client';
import open from 'open';
import ora from 'ora';
import { getConfig, isLoggedIn, logout } from '../config/index.js';
import { tableBorder, tableStyle } from '../config/table.js';

/**
 * Change endpoint in config to given one
 * @param {String} endpoint - new endpoint URL
 */
export const deployProject = async (
  folder,
  { config, endpoint: userEndpoint, token: deployToken, update, open: openInBrowser, verbose } = {}
) => {
  // exit if not logged in and no token provided
  if (!deployToken && !isLoggedIn()) {
    return;
  }

  // get user config
  const userConfig = getConfig();

  // select endpoint
  const endpoint = userEndpoint ?? userConfig.endpoint;

  console.log(chalk.bold(`${update ? 'Updating' : 'Deploying'} ${folder ?? 'current project'} to endpoint:`), endpoint);

  // show loader
  let spinner;
  if (!verbose) {
    spinner = ora('Deploying project to server...').start();
  }

  let authToken = userConfig.token;
  if (deployToken) {
    authToken = deployToken;
    console.log('\nDeploying using given token..');
  }

  // pipe stream to remote
  try {
    if (spinner) {
      spinner.text = `Uploading project..`;
    }
    const { formattedServices, log } = await deployExo({
      folder,
      endpoint,
      token: authToken,
      update,
      configFile: config,
      verbose,
    });
    // check deployments
    if (!formattedServices?.length) {
      const err = new Error('Something went wrong!');
      err.response = { error: 'Could not get services', log };
      throw err;
    }
    spinner && spinner.succeed('Deployment finished!');

    // log response in verbose-verbose mode
    verbose > 2 && console.log(chalk.gray('Server response:'), JSON.stringify(log.flat(), null, 2), '\n');

    // log result
    console.log('Your project is now deployed as:\n');
    // create table
    const resultTable = new Table({
      head: ['ID', 'URL', 'Hostname', 'Type'],
      chars: tableBorder,
      style: tableStyle,
    });

    // process deployments
    formattedServices.forEach(({ name, domain, host, type }) => {
      resultTable.push([name, domain, host, type]);
    });

    // draw table
    console.log(resultTable.toString());

    // open in browser
    if (openInBrowser && formattedServices[0].domain && formattedServices[0].domain !== 'not set') {
      console.log(chalk.gray('Opening deployed project in browser:', formattedServices[0].domain));
      open(`http://${formattedServices[0].domain.split(',')[0].trim()}`);
    }
  } catch (e) {
    spinner && spinner.fail('Deployment failed!');

    if (e.message.includes('ENOENT')) {
      console.log(chalk.red('Error deploying project:'), 'Project folder not found!');
      return process.exit(1);
    }

    const response = e.response || {};
    // if authorization is expired/broken/etc
    if (response.statusCode === 401) {
      logout(userConfig);
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return process.exit(1);
    }

    const reason = response.error || e.toString();
    console.log(chalk.red('Error deploying project:'), reason || 'Unknown reason');
    console.log('Build log:\n');
    (response.log || ['No log available'])
      .filter((l) => l !== undefined)
      .map((l) => l.trim())
      .filter((l) => l && l.length > 0)
      .forEach((line) => console.log(line));

    // if in verbose mode - log original error and response
    verbose && console.log('');
    verbose && console.log('Original error:', e);
    verbose > 1 && console.log('Original response:', e.response);
    process.exit(1);
  }
};
