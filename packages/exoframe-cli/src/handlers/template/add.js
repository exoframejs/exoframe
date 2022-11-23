import chalk from 'chalk';
import { addTemplate } from 'exoframe-client';
import inquirer from 'inquirer';
import ora from 'ora';
import { getConfig, isLoggedIn, logout } from '../../config/index.js';

export const templateAddHandler = async (name, { verbose } = {}) => {
  if (!(await isLoggedIn())) {
    console.log(chalk.red('Error: not logged in!'), 'Please, login and try again.');
    return;
  }

  // get user config
  const userConfig = await getConfig();

  // get current endpoint and auth token
  const { endpoint, token } = userConfig;

  console.log(chalk.bold(`Adding new deployment template for:`), endpoint);

  // ask for template name if not given via param
  let templateName = name;
  if (!templateName?.length) {
    const prompts = [];
    prompts.push({
      type: 'input',
      name: 'templateName',
      message: 'Template name:',
      validate: (input) => input && input.length > 0,
      filter: (input) => input.trim(),
    });
    ({ templateName } = await inquirer.prompt(prompts));
  }

  // show loader
  const spinner = ora('Installing new template...').start();

  try {
    const { success, log } = await addTemplate({ template: templateName, endpoint, token });

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
        .filter((l) => l !== undefined)
        .filter((l) => l && l.message && l.message.length > 0)
        .forEach((line) => console.log(line.message.trim()));
    }
  } catch (e) {
    spinner.fail('Template install failed!');

    // if authorization is expired/broken/etc
    if (e.message === 'Authorization expired!') {
      await logout();
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error installing deployment template:'), e.toString());
  }
};
