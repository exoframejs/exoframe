import chalk from 'chalk';
import { removeDeployment } from 'exoframe-client';
import { getConfig, isLoggedIn, logout } from '../config/index.js';

export const removeHandler = async (id, { token: deployToken } = {}) => {
  if (!deployToken && !isLoggedIn()) {
    console.log(chalk.red('Error!'), '\nYou need to sign in first or supply a authentication token.');
    return;
  }

  console.log(chalk.bold('Removing deployment:'), id);

  // get user config
  const userConfig = getConfig();

  // get current endpoint and auth token
  const endpoint = userConfig.endpoint;

  // get auth token
  let authToken = userConfig.token;
  if (deployToken) {
    authToken = deployToken;
    console.log('\nRemoving using given token..');
  }

  try {
    const removed = await removeDeployment({ id, endpoint, token: authToken });
    if (removed) {
      console.log(chalk.green('Deployment removed!'));
    } else {
      console.log(chalk.red('Error!'), 'Could not remove the deployment.');
    }
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.message === 'Authorization expired!') {
      logout(userConfig);
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    // if container was not found
    if (e.message === 'Container or function was not found!') {
      console.log(
        chalk.red('Error: container or function was not found!'),
        'Please, check deployment ID and try again.'
      );
      return;
    }

    console.log(chalk.red('Error removing project:'), e.toString());
  }
};
