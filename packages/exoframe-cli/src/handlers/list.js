import chalk from 'chalk';
import { listDeployments } from 'exoframe-client';
import { getConfig, isLoggedIn, logout } from '../config/index.js';
import { renderDeployments } from '../util/renderDeployments.js';

export const listHandler = async () => {
  // exit if not logged in
  if (!isLoggedIn()) {
    console.log(chalk.red('Error: not logged in!'), 'Please, login and try again.');
    return;
  }

  // get user config
  const userConfig = getConfig();

  // get current endpoint and auth token
  const { endpoint, token } = userConfig;

  // get deployments
  try {
    const containers = await listDeployments({ endpoint, token });

    // check for errors
    if (!containers) {
      throw new Error('Server returned empty response!');
    }
    if (containers.length === 0) {
      console.log(chalk.green(`No deployments found on ${userConfig.endpoint}!`));
      return;
    }

    // print count
    console.log(chalk.green(`${containers.length} deployments found on ${userConfig.endpoint}:\n`));

    // render containers
    if (containers.length > 0) {
      console.log(`> ${chalk.blue.bold.underline('Normal')} deployments:\n`);
      renderDeployments(containers);
    }
  } catch (err) {
    // if authorization is expired/broken/etc
    if (err.message === 'Authorization expired!') {
      logout(userConfig);
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error while getting list:'), err.toString());
  }
};
