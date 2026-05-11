import chalk from 'chalk';
import { createSecret } from 'exoframe-client';
import inquirer from 'inquirer';
import { getConfig, isLoggedIn, logout } from '../../config/index.ts';
import type { CliPromptQuestion, SecretPromptOptions } from '../../types.ts';

export const addSecretHandler = async ({ name, value }: SecretPromptOptions = {}) => {
  if (!(await isLoggedIn())) {
    console.log(chalk.red('Error: not logged in!'), 'Please, login and try again.');
    return;
  }

  // get user config
  const userConfig = await getConfig();

  // get current endpoint and auth token
  const { endpoint, token } = userConfig;
  const authToken = token ?? '';

  console.log(chalk.bold('Generating new deployment secret for:'), userConfig.endpoint);

  // get values from args if present
  let secretName = name;
  let secretValue = value;

  // if user haven't provided name and value - ask interactively
  if (!secretName || !secretValue) {
    const prompts: CliPromptQuestion[] = [
      {
        type: 'input',
        name: 'secretName',
        message: 'Secret name:',
        validate: (input: string) => input.trim().length > 0,
        filter: (input: string) => input.trim(),
      },
      {
        type: 'input',
        name: 'secretValue',
        message: 'Secret value:',
        validate: (input: string) => input.trim().length > 0,
        filter: (input: string) => input.trim(),
      },
    ];
    ({ secretName, secretValue } = await inquirer.prompt<{ secretName: string; secretValue: string }>(prompts));
  }

  // services request url
  try {
    const secret = await createSecret({ endpoint, token: authToken, name: secretName, value: secretValue });
    console.log(chalk.bold('New secret generated:'));
    console.log('');
    console.log(`Name: ${secret.name}`);
    console.log(`Value: ${secret.value}`);
    console.log('');
    console.log(chalk.green('DONE!'));
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e instanceof Error && e.message === 'Authorization expired!') {
      await logout();
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error generating deployment secret:'), e instanceof Error ? e.toString() : String(e));
  }
};
