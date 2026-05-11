import chalk from 'chalk';
import { addTemplate } from 'exoframe-client';
import inquirer from 'inquirer';
import ora from 'ora';
import { getConfig, isLoggedIn, logout } from '../../config/index.ts';
import type { CliPromptQuestion, TemplateHandlerOptions } from '../../types.ts';
import type { TemplateLogEntry } from 'exoframe-client';

const getLogMessage = (line: string | TemplateLogEntry): string | null =>
  typeof line === 'string' ? null : line.message.trim();

export const templateAddHandler = async (name?: string, { verbose }: TemplateHandlerOptions = {}) => {
  if (!(await isLoggedIn())) {
    console.log(chalk.red('Error: not logged in!'), 'Please, login and try again.');
    return;
  }

  // get user config
  const userConfig = await getConfig();

  // get current endpoint and auth token
  const { endpoint, token } = userConfig;
  const authToken = token ?? '';

  console.log(chalk.bold(`Adding new deployment template for:`), endpoint);

  // ask for template name if not given via param
  let templateName = name;
  if (!templateName?.length) {
    const prompts: CliPromptQuestion[] = [
      {
        type: 'input',
        name: 'templateName',
        message: 'Template name:',
        validate: (input: string) => input.trim().length > 0,
        filter: (input: string) => input.trim(),
      },
    ];
    ({ templateName } = await inquirer.prompt<{ templateName: string }>(prompts));
  }

  // show loader
  const spinner = ora('Installing new template...').start();

  try {
    const { success, log } = await addTemplate({ template: templateName, endpoint, token: authToken });

    if (success) {
      spinner.succeed('New template installed!');
    } else {
      spinner.fail('Error installing template!');
    }

    // show log if in verbose mode or install failed
    if (verbose || !success) {
      console.log('');
      console.log('Log:');
      (log || ['No log available'])
        .map(getLogMessage)
        .filter((line) => line !== null && line.length > 0)
        .forEach((line) => console.log(line));
    }
  } catch (e) {
    spinner.fail('Template install failed!');

    // if authorization is expired/broken/etc
    if (e instanceof Error && e.message === 'Authorization expired!') {
      await logout();
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error installing deployment template:'), e instanceof Error ? e.toString() : String(e));
  }
};
