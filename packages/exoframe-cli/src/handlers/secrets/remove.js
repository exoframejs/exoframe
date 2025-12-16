import chalk from 'chalk';
import { listSecrets, removeSecret } from 'exoframe-client';
import inquirer from 'inquirer';
import { getConfig, isLoggedIn, logout } from '../../config/index.js';

export const removeSecretHandler = async (name) => {
  if (!(await isLoggedIn())) {
    console.log(chalk.red('Error: not logged in!'), 'Please, login and try again.');
    return;
  }

  // get user config
  const userConfig = await getConfig();

  // get current endpoint and auth token
  const { endpoint, token } = userConfig;

  console.log(chalk.bold(`Removing deployment secret for:`), endpoint);

  try {
    // get selected secret from args
    let selectedSecret = name;

    // if it's not provided - present user with selection from server
    if (!selectedSecret?.length) {
      const secrets = await listSecrets({ endpoint, token });
      const prompts = [];
      prompts.push({
        type: 'select',
        name: 'selectedSecret',
        message: `Choose secret to get`,
        choices: secrets.map((t) => t.name),
      });
      ({ selectedSecret } = await inquirer.prompt(prompts));
    }

    await removeSecret({ name: selectedSecret, endpoint, token });
    console.log(chalk.green(`Deployment secret ${chalk.bold(selectedSecret)} successfully removed!`));
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.message === 'Authorization expired!') {
      await logout();
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error removing secret:'), e.toString());
  }
};
