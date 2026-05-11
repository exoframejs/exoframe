import chalk from 'chalk';
import { listTemplates, removeTemplate } from 'exoframe-client';
import inquirer from 'inquirer';
import ora from 'ora';
import { getConfig, isLoggedIn, logout } from '../../config/index.ts';
import type { CliPromptQuestion, TemplateHandlerOptions } from '../../types.ts';
import type { TemplateLogEntry } from 'exoframe-client';

const getLogMessage = (line: string | TemplateLogEntry): string | null =>
  typeof line === 'string' ? null : line.message.trim();

export const templateRemoveHandler = async (name?: string, { verbose }: TemplateHandlerOptions = {}) => {
  if (!(await isLoggedIn())) {
    console.log(chalk.red('Error: not logged in!'), 'Please, login and try again.');
    return;
  }

  // get user config
  const userConfig = await getConfig();

  // get current endpoint and auth token
  const { endpoint, token } = userConfig;
  const authToken = token ?? '';

  console.log(chalk.bold(`Removing deployment template for:`), endpoint);

  // show loader
  const spinner = ora('Removing deployment template...'); // .start();

  try {
    // list templates to chose from if not given via param
    let templateName = name;
    if (!templateName?.length) {
      const templates = await listTemplates({ endpoint, token: authToken });
      const prompts: CliPromptQuestion[] = [
        {
          type: 'select',
          name: 'templateName',
          message: 'Choose template to remove:',
          choices: Object.keys(templates),
        },
      ];
      ({ templateName } = await inquirer.prompt<{ templateName: string }>(prompts));
    }

    // show loading indicator
    spinner.start();

    // send remove request
    const { removed, log } = await removeTemplate({ template: templateName, endpoint, token: authToken });

    // handle result
    if (removed) {
      spinner.succeed('Template successfully removed!');
    } else {
      spinner.fail('Error removing template!');
    }

    // show log if in verbose mode or install failed
    if (verbose || !removed) {
      console.log('');
      console.log('Log:');
      (log || ['No log available'])
        .map(getLogMessage)
        .filter((line) => line !== null && line.length > 0)
        .forEach((line) => console.log(line));
    }
  } catch (e) {
    spinner.fail('Template removal failed!');

    // if authorization is expired/broken/etc
    if (e instanceof Error && e.message === 'Authorization expired!') {
      await logout();
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error removing deployment template:'), e instanceof Error ? e.toString() : String(e));
  }
};
