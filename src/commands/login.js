// npm packages
const chalk = require('chalk');
const got = require('got');
const inquirer = require('inquirer');

// our packages
const {userConfig, updateConfig} = require('../config');

const validate = input => input && input.length > 0;
const filter = input => input.trim();

exports.command = 'login';
exports.describe = 'login into exoframe server';
exports.builder = {};
exports.handler = async () => {
  console.log(chalk.bold('Logging in to:'), userConfig.endpoint);
  const prompts = [];
  prompts.push({
    type: 'input',
    name: 'username',
    message: 'Login:',
    validate,
    filter,
  });
  prompts.push({
    type: 'password',
    name: 'password',
    message: 'Password:',
    validate,
  });

  const {username, password} = await inquirer.prompt(prompts);

  const remoteUrl = `${userConfig.endpoint}/login`;
  try {
    const {body} = await got(remoteUrl, {
      body: {username, password},
      json: true,
    });
    // check for errors
    if (!body || !body.token || !body.user) {
      throw new Error('Error logging in!');
    }
    updateConfig(body);
    console.log(chalk.green('Successfully logged in!'));
  } catch (e) {
    console.log(
      chalk.red('Error logging in!'),
      'Check your username and password and try again.'
    );
    console.error(e);
  }
};
