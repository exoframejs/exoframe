// npm packages
const got = require('got');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');

// our packages
const {userConfig, isLoggedIn, logout} = require('../config');

exports.command = ['setup [recipe]'];
exports.describe = 'setup new deployment using recipe';
exports.builder = {
  recipe: {
    description: 'Name of the recipe to setup',
  },
  verbose: {
    alias: 'v',
    description: 'Verbose mode; will output more information',
  },
};
exports.handler = async args => {
  if (!isLoggedIn()) {
    return;
  }

  // services request url
  const remoteUrl = `${userConfig.endpoint}/setup`;
  // get command
  const {verbose, recipe} = args;
  // construct shared request params
  const baseOptions = {
    headers: {
      Authorization: `Bearer ${userConfig.token}`,
    },
    json: true,
  };

  console.log(chalk.bold('Setting new deployment using recipe at:'), userConfig.endpoint);

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
    const {givenRecipeName} = await inquirer.prompt(prompts);
    recipeName = givenRecipeName;
  }

  // ask for questions for this recipe
  const options = Object.assign({}, baseOptions, {
    method: 'GET',
    query: {
      recipeName,
    },
  });

  // show loader
  const spinner = ora('Installing new recipe...').start();

  // try sending request
  try {
    const {body} = await got(remoteUrl, options);
    const showLog = verbose || !body.success;
    if (showLog) {
      console.log('');
      console.log('Log:');
      (body.log || ['No log available'])
        .filter(l => l !== undefined)
        .filter(l => l && l.message && l.message.length > 0)
        .forEach(line => console.log(line.message.trim()));
    }
    if (!body.success) {
      spinner.fail('Error installing new recipe!');
      return;
    }

    spinner.succeed('New recipe installed! Preparing setup..');

    // get questions from body
    const {questions} = body;
    // ask user to answer
    const answers = await inquirer.prompt(questions);

    // show loader
    spinner.start('Executing recipe with user configuration...');

    // send answers and execute recipe
    const answerOptions = Object.assign({}, baseOptions, {
      method: 'POST',
      body: {
        recipeName,
        answers,
      },
    });

    const {body: finalBody} = await got(remoteUrl, answerOptions);
    const showSetupLog = verbose || !finalBody.success;
    if (showSetupLog) {
      console.log('');
      console.log('Log:');
      (finalBody.log || ['No log available'])
        .filter(l => l !== undefined)
        .filter(l => l && l.message && l.message.length > 0)
        .forEach(line => console.log(line.message.trim()));
    }

    if (!finalBody.success) {
      spinner.fail('Error executing recipe!');
      return;
    }

    spinner.succeed('Recipe successfully executed!');
  } catch (e) {
    spinner.fail('Recipe execution failed!');
    // if authorization is expired/broken/etc
    if (e.statusCode === 401) {
      logout(userConfig);
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error executing deployment recipe:'), e.toString());
  }
};
