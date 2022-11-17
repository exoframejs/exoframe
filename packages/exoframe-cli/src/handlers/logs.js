import chalk from 'chalk';
import { getLogs } from 'exoframe-client';
import { getConfig, isLoggedIn, logout } from '../config/index.js';

export const logsHandler = async (id, { follow = false } = {}) => {
  if (!isLoggedIn()) {
    return;
  }

  console.log(chalk.bold('Getting logs for deployment:'), id, '\n');

  // get user config
  const userConfig = getConfig();

  // get current endpoint and auth token
  const { endpoint, token } = userConfig;

  // services request url
  const logsEmitter = await getLogs({ id, follow, endpoint, token });
  logsEmitter.on('error', (e) => {
    console.error({ e, msg: e.message });
    // if authorization is expired/broken/etc
    if (e.message === 'Authorization expired!') {
      logout(userConfig);
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    // if container was not found
    if (e.message === 'Container was not found!') {
      console.log(chalk.red('Error: container was not found!'), 'Please, check deployment ID and try again.');
      return;
    }

    console.log(chalk.red('Error while getting logs:'), e.toString());
  });
  logsEmitter.on('data', ({ date, msg }) => {
    console.log(`${chalk.gray(`${date}`)} ${msg}`);
  });
  logsEmitter.on('end', () => {
    console.log(chalk.gray(`\nEnd of log for ${id}`));
  });
};
