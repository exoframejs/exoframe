// npm packages
const got = require('got');
const chalk = require('chalk');
const inquirer = require('inquirer');

// our packages
const {userConfig, isLoggedIn, logout} = require('../config');

exports.command = ['secret [cmd]'];
exports.describe = 'create, list or remove deployment secrets';
exports.builder = {
  cmd: {
    default: 'new',
    description: 'command to execute [new | ls | rm]',
  },
};
exports.handler = async args => {
  if (!isLoggedIn()) {
    return;
  }

  // services request url
  const remoteUrl = `${userConfig.endpoint}/secrets`;
  // get command
  const {cmd} = args;
  // if remove or ls - fetch secrets from remote, then do work
  if (cmd === 'ls' || cmd === 'rm') {
    console.log(
      chalk.bold(`${cmd === 'ls' ? 'Listing' : 'Removing'} deployment secret${cmd === 'ls' ? 's' : ''} for:`),
      userConfig.endpoint
    );

    // get secrets from server
    // construct shared request params
    const options = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userConfig.token}`,
      },
      json: true,
    };
    // try sending request
    let secrets = [];
    try {
      const {body} = await got(remoteUrl, options);
      secrets = body.secrets;
    } catch (e) {
      // if authorization is expired/broken/etc
      if (e.statusCode === 401) {
        logout(userConfig);
        console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
        return;
      }

      console.log(chalk.red('Error getting deployment secrets:'), e.toString());
      return;
    }

    if (cmd === 'ls') {
      console.log(chalk.bold('Got saved secrets:'));
      console.log('');
      secrets.map(t =>
        console.log(`  > ${chalk.green(`@${t.name}`)} ${chalk.gray(`[${new Date(t.meta.created).toLocaleString()}]`)}`)
      );
      if (!secrets.length) {
        console.log('  > No deployment secrets available!');
      }
      return;
    }

    const prompts = [];
    prompts.push({
      type: 'list',
      name: 'rmSecret',
      message: 'Choose secret to remove:',
      choices: secrets.map(t => t.name),
    });
    const {rmSecret} = await inquirer.prompt(prompts);

    // construct shared request params
    const rmOptions = {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${userConfig.token}`,
      },
      json: true,
      body: {
        secretName: rmSecret,
      },
    };
    try {
      const {body, statusCode} = await got(remoteUrl, rmOptions);
      if (statusCode !== 204) {
        console.log(chalk.red('Error removing deployment secret!'), body.reason || 'Please try again!');
        return;
      }
      console.log(chalk.green('Deployment secret successfully removed!'));
    } catch (e) {
      // if authorization is expired/broken/etc
      if (e.statusCode === 401) {
        logout(userConfig);
        console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
        return;
      }

      console.log(chalk.red('Error removing secret:'), e.toString());
      return;
    }

    return;
  }

  console.log(chalk.bold('Generating new deployment secret for:'), userConfig.endpoint);

  // ask for secret name and value
  const prompts = [];
  prompts.push({
    type: 'input',
    name: 'secretName',
    message: 'Secret name:',
    validate: input => input && input.length > 0,
    filter: input => input.trim(),
  });
  prompts.push({
    type: 'input',
    name: 'secretValue',
    message: 'Secret value:',
    validate: input => input && input.length > 0,
    filter: input => input.trim(),
  });
  const {secretName, secretValue} = await inquirer.prompt(prompts);

  // construct shared request params
  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userConfig.token}`,
    },
    json: true,
    body: {
      secretName,
      secretValue,
    },
  };
  // try sending request
  try {
    const {body} = await got(remoteUrl, options);
    console.log(chalk.bold('New secret generated:'));
    console.log('');
    console.log(`Name: ${body.name}`);
    console.log(`Value: ${body.value}`);
    console.log('');
    console.log(chalk.yellow('WARNING!'), `Make sure to write it down, you will not be able to get it's value again!`);
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.statusCode === 401) {
      logout(userConfig);
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error generating deployment secret:'), e.toString());
  }
};
