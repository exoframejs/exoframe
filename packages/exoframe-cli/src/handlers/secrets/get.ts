import chalk from 'chalk';
import { getSecret, listSecrets } from 'exoframe-client';
import inquirer from 'inquirer';
import { getConfig, isLoggedIn, logout } from '../../config/index.ts';
import type { CliPromptQuestion, SecretGetOptions } from '../../types.ts';

type LegacySecret = {
  name: string;
  value?: string;
  meta?: {
    created: string;
  };
  secretName?: string;
  secretValue?: string;
};

export const getSecretHandler = async (name?: string, { yes }: SecretGetOptions = {}) => {
  if (!(await isLoggedIn())) {
    console.log(chalk.red('Error: not logged in!'), 'Please, login and try again.');
    return;
  }

  // get user config
  const userConfig = await getConfig();

  // get current endpoint and auth token
  const { endpoint, token } = userConfig;
  const authToken = token ?? '';

  console.log(chalk.bold(`Getting deployment secret for:`), endpoint);

  try {
    // get selected secret from args
    let selectedSecret = name;

    // if it's not provided - present user with selection from server
    if (!selectedSecret?.length) {
      const secrets = await listSecrets({ endpoint, token: authToken });
      const prompts: CliPromptQuestion[] = [
        {
          type: 'select',
          name: 'selectedSecret',
          message: `Choose secret to get`,
          choices: secrets.map((secret) => secret.name),
        },
      ];
      ({ selectedSecret } = await inquirer.prompt<{ selectedSecret: string }>(prompts));
    }

    if (!yes) {
      const { doGet } = await inquirer.prompt<{ doGet: boolean }>([
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

    const secret = (await getSecret({ name: selectedSecret, endpoint, token: authToken })) as LegacySecret;
    if (!secret) {
      console.log(chalk.red('Error: no secret with this name found on server!'));
      return;
    }
    console.log(chalk.bold('Current secret value:'));
    console.log('');
    console.log(`Name: ${secret.secretName ?? secret.name}`);
    console.log(`Value: ${secret.secretValue ?? secret.value ?? ''}`);
    console.log(`Date: ${new Date(secret.meta?.created ?? '').toLocaleString()}`);
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e instanceof Error && e.message === 'Authorization expired!') {
      await logout();
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error getting deployment secret:'), e instanceof Error ? e.toString() : String(e));
  }
};
