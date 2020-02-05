// npm packages
const got = require('got');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const Table = require('cli-table3');

// our packages
const {userConfig, isLoggedIn, logout} = require('../config');
const {tableBorder, tableStyle} = require('../config/table');

exports.command = ['template [cmd]'];
exports.describe = 'add, list or remove deployment template';
exports.builder = {
  cmd: {
    default: '',
    description: 'command to execute [ls | rm]',
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
  const remoteUrl = `${userConfig.endpoint}/templates`;
  // get command
  const {cmd, verbose} = args;
  // construct shared request params
  const baseOptions = {
    headers: {
      Authorization: `Bearer ${userConfig.token}`,
    },
    responseType: 'json',
  };

  // if remove or ls - fetch tokens from remote, then do work
  if (cmd === 'ls' || cmd === 'rm') {
    console.log(
      chalk.bold(`${cmd === 'ls' ? 'Listing' : 'Removing'} deployment template${cmd === 'ls' ? 's' : ''} for:`),
      userConfig.endpoint
    );

    // try sending request
    let templates = [];
    try {
      const {body} = await got(remoteUrl, {...baseOptions});
      templates = body;
    } catch (e) {
      // if authorization is expired/broken/etc
      if (e.response.statusCode === 401) {
        logout(userConfig);
        console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
        return;
      }

      console.log(chalk.red('Error while getting templates:'), e.toString());
      return;
    }
    // check for errors
    if (!templates) {
      throw new Error('Server returned empty response!');
    }

    // if no templates - just exit
    if (templates.length === 0) {
      console.log(chalk.green(`No templates found on ${userConfig.endpoint}!`));
      return;
    }

    if (cmd === 'ls') {
      // print count
      console.log(chalk.green(`${Object.keys(templates).length} templates found on ${userConfig.endpoint}:\n`));

      // create table
      const resultTable = new Table({
        head: ['Template', 'Version'],
        chars: tableBorder,
        style: tableStyle,
      });
      Object.keys(templates).forEach(name => resultTable.push([name, templates[name]]));

      console.log(resultTable.toString());
      return;
    }

    const prompts = [];
    prompts.push({
      type: 'list',
      name: 'rmTemplate',
      message: 'Choose template to remove:',
      choices: Object.keys(templates),
    });
    const {rmTemplate} = await inquirer.prompt(prompts);

    // construct shared request params
    const rmOptions = {
      ...baseOptions,
      method: 'DELETE',
      json: {
        templateName: rmTemplate,
      },
      responseType: 'json',
    };
    try {
      const {body} = await got(remoteUrl, rmOptions);
      if (!body.removed) {
        console.log(chalk.red('Error removing template!'));
        console.log('');
        console.log('Log:');
        (body.log || ['No log available'])
          .filter(l => l !== undefined)
          .filter(l => l && l.message && l.message.length > 0)
          .forEach(line => console.log(line.message.trim()));
        return;
      }
      console.log(chalk.green('Template successfully removed!'));
    } catch (e) {
      // if authorization is expired/broken/etc
      if (e.response.statusCode === 401) {
        logout(userConfig);
        console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
        return;
      }

      console.log(chalk.red('Error removing template:'), e.toString());
      return;
    }

    return;
  }

  console.log(chalk.bold('Adding new deployment template for:'), userConfig.endpoint);

  // ask for template name
  const prompts = [];
  prompts.push({
    type: 'input',
    name: 'templateName',
    message: 'Template name:',
    validate: input => input && input.length > 0,
    filter: input => input.trim(),
  });
  const {templateName} = await inquirer.prompt(prompts);

  // construct shared request params
  const options = {
    ...baseOptions,
    method: 'POST',
    json: {
      templateName,
    },
    responseType: 'json',
  };

  // show loader
  const spinner = ora('Installing new template...').start();

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
    if (body.success) {
      spinner.succeed('New template installed!');
    } else {
      spinner.fail('Error installing template!');
    }
  } catch (e) {
    spinner.fail('Template install failed!');
    // if authorization is expired/broken/etc
    if (e.response.statusCode === 401) {
      logout(userConfig);
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error installing deployment template:'), e.toString());
  }
};
