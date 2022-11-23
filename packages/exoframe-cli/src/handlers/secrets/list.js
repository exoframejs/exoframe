import chalk from 'chalk';
import { listSecrets } from 'exoframe-client';
import { getConfig, isLoggedIn, logout } from '../../config/index.js';

export const listSecretsHandler = async () => {
  if (!(await isLoggedIn())) {
    console.log(chalk.red('Error: not logged in!'), 'Please, login and try again.');
    return;
  }

  // get user config
  const userConfig = await getConfig();

  // get current endpoint and auth token
  const { endpoint, token } = userConfig;

  console.log(chalk.bold(`Listing deployment secrets for:`), endpoint);

  try {
    const secrets = await listSecrets({ endpoint, token });
    console.log(chalk.bold('Got saved secrets:'));
    console.log('');
    secrets.forEach((secret) =>
      console.log(
        `  > ${chalk.green(`@${secret.name}`)} ${chalk.gray(`[${new Date(secret.meta.created).toLocaleString()}]`)}`
      )
    );
    if (!secrets.length) {
      console.log('  > No deployment secrets available!');
    }
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.message === 'Authorization expired!') {
      await logout();
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error getting deployment secrets:'), e.toString());
  }
};
