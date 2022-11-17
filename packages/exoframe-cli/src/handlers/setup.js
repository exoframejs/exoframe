import chalk from 'chalk';
import { executeRecipe, getRecipeQuestions } from 'exoframe-client';
import inquirer from 'inquirer';
import ora from 'ora';
import { getConfig, isLoggedIn, logout } from '../config/index.js';

export const setupHandler = async (recipe, { verbose } = {}) => {
  if (!isLoggedIn()) {
    console.log(chalk.red('Error!'), '\nYou need to sign in first or supply a authentication token.');
    return;
  }

  // get user config
  const userConfig = getConfig();

  // get current endpoint and auth token
  const { endpoint, token } = userConfig;

  console.log(chalk.bold('Setting new deployment using recipe at:'), endpoint);

  // show loader
  const spinner = ora('Installing new recipe...').start();

  try {
    // get recipe name from params
    let recipeName = recipe;

    // ask for Recipe name if not given
    if (!recipeName) {
      const prompts = [];
      prompts.push({
        type: 'input',
        name: 'givenRecipeName',
        message: 'Recipe name:',
      });
      const { givenRecipeName } = await inquirer.prompt(prompts);
      recipeName = givenRecipeName;
    }

    // get recipe questions
    const questions = await getRecipeQuestions({ recipe: recipeName, endpoint, token });
    // show success
    spinner.succeed('New recipe installed! Preparing setup..');
    // ask user to answer
    const answers = await inquirer.prompt(questions);

    // show loader
    spinner.start('Executing recipe with user configuration...');

    // execute recipe
    const { log = [{ message: 'No log available', level: 'debug' }] } = await executeRecipe({
      endpoint,
      token,
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
    if (e.message === 'Authorization expired!') {
      logout(userConfig);
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error executing deployment recipe:'), e.toString());
  }
};
