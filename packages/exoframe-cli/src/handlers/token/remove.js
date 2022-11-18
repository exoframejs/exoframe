import chalk from 'chalk';
import { listTokens, removeToken } from 'exoframe-client';
import inquirer from 'inquirer';
import ora from 'ora';
import { getConfig, isLoggedIn, logout } from '../../config/index.js';

export const tokenRemoveHandler = async (name) => {
  if (!isLoggedIn()) {
    console.log(chalk.red('Error: not logged in!'), 'Please, login and try again.');
    return;
  }

  // get user config
  const userConfig = getConfig();

  // get current endpoint and auth token
  const { endpoint, token } = userConfig;

  console.log(chalk.bold(`Removing deployment token for:`), endpoint);

  // show loader
  const spinner = ora('Removing deployment token...'); // .start();

  try {
    // list tokens to chose from if not given via param
    let tokenName = name;
    if (!tokenName?.length) {
      const tokens = await listTokens({ endpoint, token });
      const prompts = [];
      prompts.push({
        type: 'list',
        name: 'tokenName',
        message: 'Choose token to remove:',
        choices: tokens.map((t) => t.tokenName),
      });
      ({ tokenName } = await inquirer.prompt(prompts));
    }

    // show loading indicator
    spinner.start();

    // send remove request
    await removeToken({ name: tokenName, endpoint, token });

    // handle result
    spinner.succeed('Token successfully removed!');
  } catch (e) {
    spinner.fail('Token removal failed!');

    // if authorization is expired/broken/etc
    if (e.message === 'Authorization expired!') {
      logout(userConfig);
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error removing deployment token:'), e.toString());
  }
};
