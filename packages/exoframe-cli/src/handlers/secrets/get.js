import chalk from 'chalk';
import { getSecret, listSecrets } from 'exoframe-client';
import inquirer from 'inquirer';
import { getConfig, isLoggedIn, logout } from '../../config/index.js';

export const getSecretHandler = async (name, { yes } = {}) => {
  if (!isLoggedIn()) {
    console.log(chalk.red('Error: not logged in!'), 'Please, login and try again.');
    return;
  }

  // get user config
  const userConfig = getConfig();

  // get current endpoint and auth token
  const { endpoint, token } = userConfig;

  console.log(chalk.bold(`Getting deployment secret for:`), endpoint);

  try {
    // get selected secret from args
    let selectedSecret = name;

    // if it's not provided - present user with selection from server
    if (!selectedSecret?.length) {
      const secrets = await listSecrets({ endpoint, token });
      const prompts = [];
      prompts.push({
        type: 'list',
        name: 'selectedSecret',
        message: `Choose secret to get`,
        choices: secrets.map((t) => t.name),
      });
      ({ selectedSecret } = await inquirer.prompt(prompts));
    }

    if (!yes) {
      const { doGet } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'doGet',
          message: 'Get secret value? (will be shown in plain text)',
          default: false,
        },
      ]);

      if (!doGet) {
        console.log(chalk.red('Stopping!'), 'User decided not to read secret value..');
        return;
      }
    }

    const secret = await getSecret({ name: selectedSecret, endpoint, token });
    console.log(chalk.bold('Current secret value:'));
    console.log('');
    console.log(`Name: ${secret.secretName}`);
    console.log(`Value: ${secret.secretValue}`);
    console.log(`Date: ${new Date(secret.meta.created).toLocaleString()}`);
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.message === 'Authorization expired!') {
      logout(userConfig);
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error getting deployment secret:'), e.toString());
  }
};
