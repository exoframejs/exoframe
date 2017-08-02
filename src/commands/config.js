// npm packages
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

const util = require('util');

const validate = input => input && input.length > 0;
const filter = input => input.trim();

exports.command = 'config';
exports.describe = 'generate new config file for current project';
exports.builder = {};
exports.handler = async () => {
  const workdir = process.cwd();
  const folderName = path.basename(workdir);
  const configPath = path.join(workdir, 'exoframe.json');
  let defaultConfig = {
    name: folderName,
    domain: '',
    project: '',
    restart: 'on-failure:2',
    env: undefined,
    hostname: '',
  };
  try {
    fs.statSync(configPath);
    console.log(chalk.green('Config already exists! Editing..'));
    defaultConfig = JSON.parse(fs.readFileSync(configPath).toString());
  } catch (e) {
    // check if config didn't exist
    if (e.message.includes('ENOENT')) {
      console.log('Creating new config..');
    } else {
      // if there was any parsing error - show message and die
      console.log(chalk.red('Error parsing existing config! Please make sure it is valid and try again.'));
      return;
    }
  }

  // ask user for values
  // generate and show choices
  const prompts = [];
  prompts.push({
    type: 'input',
    name: 'name',
    message: 'Project name:',
    default: defaultConfig.name,
    validate,
    filter,
  });
  prompts.push({
    type: 'input',
    name: 'domain',
    message: 'Domain [optional]:',
    default: defaultConfig.domain,
    filter,
  });
  prompts.push({
    type: 'input',
    name: 'project',
    message: 'Project [optional]:',
    default: defaultConfig.project,
    filter,
  });
  prompts.push({
    type: 'input',
    name: 'env',
    message: 'Env variables [comma-separated, optional]:',
    default: defaultConfig.env
      ? Object.keys(defaultConfig.env).map(k => `${k.toUpperCase()}=${defaultConfig.env[k]}`).join(', ')
      : '',
    filter,
  });
  prompts.push({
    type: 'input',
    name: 'hostname',
    message: 'Hostname [optional]:',
    default: defaultConfig.hostname,
    filter,
  });
  prompts.push({
    type: 'list',
    name: 'restart',
    message: 'Restart policy [optional]:',
    default: defaultConfig.restart,
    choices: ['no', 'on-failure:2', 'always'],
  });
  // get values from user
  const {name, domain, project, env, hostname, restart} = await inquirer.prompt(prompts);
  // init config object
  const config = {name, restart};
  if (domain && domain.length) {
    config.domain = domain;
  }
  if (project && project.length) {
    config.project = project;
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
