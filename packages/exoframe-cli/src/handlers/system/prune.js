import chalk from 'chalk';
import { pruneSystem } from 'exoframe-client';
import prettyBytes from 'pretty-bytes';
import { getConfig, isLoggedIn, logout } from '../../config/index.js';

export const systemPruneHandler = async () => {
  if (!(await isLoggedIn())) {
    console.log(chalk.red('Error: not logged in!'), 'Please, login and try again.');
    return;
  }

  // get user config
  const userConfig = await getConfig();

  // get current endpoint and auth token
  const { endpoint, token } = userConfig;

  console.log(chalk.bold(`Prunning docker system on:`), endpoint);

  try {
    const { prunedBytes } = await pruneSystem({ endpoint, token });
    console.log(chalk.bold('Data prune successful!'));
    console.log('');
    console.log(chalk.bold('Reclaimed:'), prettyBytes(prunedBytes));
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.message === 'Authorization expired!') {
      await logout();
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error executing prune command:'), e.toString());
  }
};
