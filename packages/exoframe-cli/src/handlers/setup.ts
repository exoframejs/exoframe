import chalk from 'chalk';
import { executeRecipe, getRecipeQuestions } from 'exoframe-client';
import inquirer from 'inquirer';
import ora from 'ora';
import { getConfig, isLoggedIn, logout } from '../config/index.ts';
import type { CliPromptQuestion, SetupHandlerOptions } from '../types.ts';

export const setupHandler = async (recipe?: string, { verbose }: SetupHandlerOptions = {}) => {
  if (!(await isLoggedIn())) {
    console.log(chalk.red('Error!'), '\nYou need to sign in first or supply a authentication token.');
    return;
  }

  // get user config
  const userConfig = await getConfig();

  // get current endpoint and auth token
  const { endpoint, token } = userConfig;
  const authToken = token ?? '';

  console.log(chalk.bold('Setting new deployment using recipe at:'), endpoint);

  // show loader
  const spinner = ora('Installing new recipe...').start();

  try {
    // get recipe name from params
    let recipeName = recipe;

    // ask for Recipe name if not given
    if (!recipeName) {
      const prompts: CliPromptQuestion[] = [{ type: 'input', name: 'givenRecipeName', message: 'Recipe name:' }];
      const { givenRecipeName } = await inquirer.prompt<{ givenRecipeName: string }>(prompts);
      recipeName = givenRecipeName;
    }

    // get recipe questions
    const { questions } = await getRecipeQuestions({ recipe: recipeName, endpoint, token: authToken });
    // show success
    spinner.succeed('New recipe installed! Preparing setup..');
    // ask user to answer
    const answers = await inquirer.prompt<Record<string, string | number | boolean | undefined>>(questions);

    // show loader
    spinner.start('Executing recipe with user configuration...');

    // execute recipe
    const { log = [{ message: 'No log available', level: 'debug' }] } = await executeRecipe({
      endpoint,
      token: authToken,
      answers,
      name: recipeName,
    });
    console.log('');
    verbose ? console.log('Log:') : console.log('');
    log
      .filter((l) => l !== undefined)
      .filter((l) => verbose || l.level === 'info')
      .filter((l) => l && l.message && l.message.length > 0)
      .forEach((line) => console.log(line.message.trim()));
    console.log('');

    spinner.succeed('Recipe successfully executed!');
  } catch (e) {
    spinner.fail('Recipe execution failed!');
    // if authorization is expired/broken/etc
    if (e instanceof Error && e.message === 'Authorization expired!') {
      await logout();
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error executing deployment recipe:'), e instanceof Error ? e.toString() : String(e));
  }
};
