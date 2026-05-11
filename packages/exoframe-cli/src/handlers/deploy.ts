import chalk from 'chalk';
import { deploy as deployExo } from 'exoframe-client';
import type { LogEntry } from 'exoframe-client';
import open from 'open';
import ora from 'ora';
import { getConfig, isLoggedIn, logout } from '../config/index.ts';
import type { CliError, DeployHandlerOptions } from '../types.ts';
import { renderDeployments } from '../util/renderDeployments.ts';

const formatLogEntry = (entry: LogEntry) => entry.map((part) => String(part)).join(' ');

export const deployProject = async (folder?: string, options: DeployHandlerOptions = {}) => {
  const { config, endpoint: userEndpoint, token: deployToken, update, open: openInBrowser, verbose } = options;
  // exit if not logged in and no token provided
  if (!deployToken && !(await isLoggedIn())) {
    console.log(chalk.red('Error: not logged in!'), 'Please, login and try again.');
    return;
  }

  // get user config
  const userConfig = await getConfig();

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
      const err: CliError = new Error('Something went wrong!');
      err.response = { error: 'Could not get services', log: log.map(formatLogEntry) };
      throw err;
    }
    if (spinner) {
      spinner.succeed('Deployment finished!');
    }

    // log result
    console.log('Your project is now deployed as:\n');
    // create table
    renderDeployments(formattedServices);

    // open in browser
    if (openInBrowser && formattedServices[0].domain && formattedServices[0].domain !== 'not set') {
      console.log(chalk.gray('Opening deployed project in browser:', formattedServices[0].domain));
      open(`http://${formattedServices[0].domain.split(',')[0].trim()}`);
    }
  } catch (e) {
    if (spinner) {
      spinner.fail('Deployment failed!');
    }
    const error = (e instanceof Error ? e : new Error(String(e))) as CliError;

    if (error.message.includes('ENOENT')) {
      console.log(chalk.red('Error deploying project:'), 'Project folder not found!');
      return process.exit(1);
    }

    const response = error.response ?? {};
    // if authorization is expired/broken/etc
    if (response.statusCode === 401) {
      await logout();
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return process.exit(1);
    }

    const reason = response.error || error.toString();
    console.log(chalk.red('Error deploying project:'), reason || 'Unknown reason');
    console.log('Build log:\n');
    (response.log || ['No log available'])
      .filter((l) => l !== undefined)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .forEach((line) => console.log(line));

    // if in verbose mode - log original error and response
    if (verbose) {
      console.log('');
      console.log('Original error:', error);
    }
    if ((verbose ?? 0) > 1) {
      console.log('Original response:', error.response);
    }
    process.exit(1);
  }
};
