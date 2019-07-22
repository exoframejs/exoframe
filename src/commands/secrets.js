// npm packages
const got = require('got');
const chalk = require('chalk');
const inquirer = require('inquirer');

// our packages
const {userConfig, isLoggedIn, logout} = require('../config');

exports.command = ['secret [cmd] [name] [value]'];
exports.describe = 'create, list or remove deployment secrets';
exports.builder = {
  cmd: {
    default: 'new',
    description: 'command to execute [new | ls | get | rm]',
  },
  name: {
    description: 'name of the secret',
  },
  value: {
    description: 'new value of the secret',
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
  if (cmd === 'ls' || cmd === 'rm' || cmd === 'get') {
    const actions = {
      ls: 'Listing',
      rm: 'Removing',
      get: 'Getting',
    };
    console.log(chalk.bold(`${actions[cmd]} deployment secret${cmd === 'ls' ? 's' : ''} for:`), userConfig.endpoint);

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

    // get selected secret from args
    let selectedSecret = args.name;

    // if it's not provided - present user with selection
    if (!selectedSecret || !selectedSecret.length) {
      const prompts = [];
      prompts.push({
        type: 'list',
        name: 'selectedSecret',
        message: `Choose secret to ${cmd === 'get' ? 'get' : 'remove'}:`,
        choices: secrets.map(t => t.name),
      });
      ({selectedSecret} = await inquirer.prompt(prompts));
    }

    // if getting secret - ask user once more if he's sure
    if (cmd === 'get') {
      const {doGet} = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'doGet',
          message: 'Get secret value? (will be shown in plain text)',
          default: false,
        },
      ]);

      if (!doGet) {
        console.log(chalk.red('Stopping!'), 'User decided not to read secret value..');
        return;
      }

      // get secrets from server
      // construct shared request params
      const options = {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${userConfig.token}`,
        },
        json: true,
      };
      let secret;
      try {
        const {body} = await got(`${remoteUrl}/${selectedSecret}`, options);
        secret = body.secret;
      } catch (e) {
        // if authorization is expired/broken/etc
        if (e.statusCode === 401) {
          logout(userConfig);
          console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
          return;
        }

        console.log(chalk.red('Error getting deployment secret:'), e.toString());
        return;
      }

      console.log(chalk.bold('New secret generated:'));
      console.log('');
      console.log(`Name: ${secret.name}`);
      console.log(`Value: ${secret.value}`);
      console.log(`Date: ${new Date(secret.meta.created).toLocaleString()}`);

      return;
    }

    // construct shared request params
    const rmOptions = {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${userConfig.token}`,
      },
      json: true,
      body: {
        secretName: selectedSecret,
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

  let secretName = args.name;
  let secretValue = args.value;

  // if user haven't provided name and value - ask interactively
  if (!secretName || !secretValue) {
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
    ({secretName, secretValue} = await inquirer.prompt(prompts));
  }

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
    console.log(chalk.green('DONE!'));
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
