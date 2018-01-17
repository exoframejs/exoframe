// npm packages
const got = require('got');
const chalk = require('chalk');
const inquirer = require('inquirer');

// our packages
const {userConfig, isLoggedIn, logout} = require('../config');

exports.command = ['token [cmd]'];
exports.describe = 'generate, list or remove deployment token';
exports.builder = {
  cmd: {
    default: '',
    description: 'command to execute [ls | rm]',
  },
};
exports.handler = async args => {
  if (!isLoggedIn()) {
    return;
  }

  // services request url
  const remoteUrl = `${userConfig.endpoint}/deployToken`;
  // get command
  const {cmd} = args;
  // if remove or ls - fetch tokens from remote, then do work
  if (cmd === 'ls' || cmd === 'rm') {
    console.log(
      chalk.bold(`${cmd === 'ls' ? 'Listing' : 'Removing'} deployment token${cmd === 'ls' ? 's' : ''} for:`),
      userConfig.endpoint
    );

    // get tokens from server
    // construct shared request params
    const options = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userConfig.token}`,
      },
      json: true,
    };
    // try sending request
    let tokens = [];
    try {
      const {body} = await got(remoteUrl, options);
      tokens = body.tokens;
    } catch (e) {
      // if authorization is expired/broken/etc
      if (e.statusCode === 401) {
        logout(userConfig);
        console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
        return;
      }

      console.log(chalk.red('Error getting deployment tokens:'), e.toString());
      return;
    }

    if (cmd === 'ls') {
      console.log(chalk.bold('Got generated tokens:'));
      console.log('');
      tokens.map(t =>
        console.log(`  > ${chalk.green(t.tokenName)} ${chalk.gray(`[${new Date(t.meta.created).toLocaleString()}]`)}`)
      );
      if (!tokens.length) {
        console.log('  > No deployment tokens available!');
      }
      return;
    }

    const prompts = [];
    prompts.push({
      type: 'list',
      name: 'rmToken',
      message: 'Choose token to remove:',
      choices: tokens.map(t => t.tokenName),
    });
    const {rmToken} = await inquirer.prompt(prompts);

    // construct shared request params
    const rmOptions = {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${userConfig.token}`,
      },
      json: true,
      body: {
        tokenName: rmToken,
      },
    };
    try {
      const {body, statusCode} = await got(remoteUrl, rmOptions);
      if (statusCode !== 204) {
        console.log(chalk.red('Error removing deployment token!'), body.reason || 'Please try again!');
        return;
      }
      console.log(chalk.green('Deployment token successfully removed!'));
    } catch (e) {
      // if authorization is expired/broken/etc
      if (e.statusCode === 401) {
        logout(userConfig);
        console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
        return;
      }

      console.log(chalk.red('Error removing token:'), e.toString());
      return;
    }

    return;
  }

  console.log(chalk.bold('Generating new deployment token for:'), userConfig.endpoint);

  // ask for token name
  const prompts = [];
  prompts.push({
    type: 'input',
    name: 'tokenName',
    message: 'Token name:',
    validate: input => input && input.length > 0,
    filter: input => input.trim(),
  });
  const {tokenName} = await inquirer.prompt(prompts);

  // construct shared request params
  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userConfig.token}`,
    },
    json: true,
    body: {
      tokenName,
    },
  };
  // try sending request
  try {
    const {body} = await got(remoteUrl, options);
    const {token} = body;
    console.log(chalk.bold('New token generated:'));
    console.log('');
    console.log(token);
    console.log('');
    console.log(chalk.yellow('WARNING!'), 'Make sure to write it down, you will not be able to get it again!');
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.statusCode === 401) {
      logout(userConfig);
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error generating deployment token:'), e.toString());
  }
};
