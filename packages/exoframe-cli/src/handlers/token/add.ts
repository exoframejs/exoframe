import chalk from 'chalk';
import { createToken } from 'exoframe-client';
import inquirer from 'inquirer';
import ora from 'ora';
import { getConfig, isLoggedIn, logout } from '../../config/index.ts';
import type { CliPromptQuestion } from '../../types.ts';

export const tokenAddHandler = async (name?: string) => {
  if (!(await isLoggedIn())) {
    console.log(chalk.red('Error: not logged in!'), 'Please, login and try again.');
    return;
  }

  // get user config
  const userConfig = await getConfig();

  // get current endpoint and auth token
  const { endpoint, token } = userConfig;
  const authToken = token ?? '';

  console.log(chalk.bold(`Adding new deployment token for:`), endpoint);

  // ask for template name if not given via param
  let tokenName = name;
  if (!tokenName?.length) {
    const prompts: CliPromptQuestion[] = [
      {
        type: 'input',
        name: 'tokenName',
        message: 'Token name:',
        validate: (input: string) => input.trim().length > 0,
        filter: (input: string) => input.trim(),
      },
    ];
    ({ tokenName } = await inquirer.prompt<{ tokenName: string }>(prompts));
  }

  // show loader
  const spinner = ora('Generating new deployment token...').start();

  try {
    const generatedToken = await createToken({ name: tokenName, endpoint, token: authToken });

    spinner.succeed('New token generated:');
    console.log('');
    console.log(` > Name: ${generatedToken.name}`);
    console.log(` > Value: ${generatedToken.value}`);
    console.log('');
    console.log(chalk.yellow('WARNING!'), `Make sure to write it down, you will not be able to get it's value again!`);
  } catch (e) {
    spinner.fail('Generating deployment token failed!');

    // if authorization is expired/broken/etc
    if (e instanceof Error && e.message === 'Authorization expired!') {
      await logout();
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error generating deployment token:'), e instanceof Error ? e.toString() : String(e));
  }
};
