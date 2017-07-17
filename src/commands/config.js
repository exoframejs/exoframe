// npm packages
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

const validate = input => input && input.length > 0;
const filter = input => input.trim();

exports.command = 'config';
exports.describe = 'generate new config file for current project';
exports.builder = {};
exports.handler = async () => {
  const workdir = process.cwd();
  const folderName = path.basename(workdir);
  const configPath = path.join(workdir, 'exoframe.json');
  try {
    fs.statSync(configPath);
    console.log(chalk.green('Config already exists!'));
    return;
  } catch (e) {
    console.log('Creating new config..');
  }

  // ask user for values
  // generate and show choices
  const prompts = [];
  prompts.push({
    type: 'input',
    name: 'name',
    message: 'Project name:',
    default: folderName,
    validate,
    filter,
  });
  prompts.push({
    type: 'input',
    name: 'domain',
    message: 'Domain [optional]:',
    filter,
  });
  prompts.push({
    type: 'input',
    name: 'env',
    message: 'Env variables [comma-separated, optional]:',
    filter,
  });
  prompts.push({
    type: 'input',
    name: 'hostname',
    message: 'Hostname [optional]:',
    filter,
  });
  prompts.push({
    type: 'list',
    name: 'restart',
    message: 'Restart policy [optional]:',
    default: 'on-failure:2',
    choices: ['no', 'on-failure:2', 'always'],
  });
  // get values from user
  const {name, domain, env, hostname, restart} = await inquirer.prompt(prompts);
  // init config object
  const config = {name, restart};
  if (domain && domain.length) {
    config.domain = domain;
  }
  if (env && env.length) {
    config.env = env
      .split(',')
      .map(kv => kv.split('='))
      .map(pair => ({key: pair[0].trim(), value: pair[1].trim()}))
      .reduce((prev, obj) => Object.assign(prev, {[obj.key]: obj.value}), {});
  }
  if (hostname && hostname.length) {
    config.hostname = hostname;
  }

  // write config
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  console.log(chalk.green('Config created!'));
};
