import chalk from 'chalk';
import { listTokens } from 'exoframe-client';
import { getConfig, isLoggedIn, logout } from '../../config/index.js';

export const tokenListHandler = async () => {
  if (!(await isLoggedIn())) {
    console.log(chalk.red('Error: not logged in!'), 'Please, login and try again.');
    return;
  }

  // get user config
  const userConfig = await getConfig();

  // get current endpoint and auth token
  const { endpoint, token } = userConfig;

  console.log(chalk.bold(`Listing deployment tokens for:`), endpoint);

  try {
    const tokens = await listTokens({ endpoint, token });

    console.log(chalk.bold('Got generated tokens:'));
    console.log('');
    tokens.map((t) =>
      console.log(`  > ${chalk.green(t.tokenName)} ${chalk.gray(`[${new Date(t.meta.created).toLocaleString()}]`)}`)
    );
    if (!tokens.length) {
      console.log('  > No deployment tokens available!');
    }
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.message === 'Authorization expired!') {
      await logout();
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error listing deployment tokens:'), e.toString());
  }
};
