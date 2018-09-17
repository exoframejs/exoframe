// npm packages
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

const validate = input => input && input.length > 0;
const filter = input => (input ? input.trim() : '');

const pairValidation = input => {
  if (!input) {
    return true;
  }

  const pairs = input.split(',');
  const res = pairs.map(pair => {
    const s = pair.split('=');
    const [key, val] = s;
    return key && val;
  });
  if (res.some(r => !r)) {
    return `Value should be specified in 'key=val,key2=val2' format!`;
  }
  return true;
};

exports.command = ['config', 'init'];
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
    labels: undefined,
    hostname: '',
    template: '',
    rateLimit: {
      period: '1s',
      average: 1,
      burst: 5,
    },
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
      ? Object.keys(defaultConfig.env)
          .map(k => `${k.toUpperCase()}=${defaultConfig.env[k]}`)
          .join(', ')
      : '',
    filter,
    validate: pairValidation,
  });
  prompts.push({
    type: 'input',
    name: 'labels',
    message: 'Labels [comma-separated, optional]:',
    default: defaultConfig.labels
      ? Object.keys(defaultConfig.labels)
          .map(k => `${k}=${defaultConfig.labels[k]}`)
          .join(', ')
      : '',
    filter,
    validate: pairValidation,
  });
  prompts.push({
    type: 'confirm',
    name: 'enableRatelimit',
    message: 'Enable rate-limit? [optional]',
    default: !!defaultConfig.rateLimit,
  });
  prompts.push({
    type: 'input',
    name: 'ratelimitPeriod',
    message: 'Rate-limit period (in seconds)',
    default: defaultConfig.rateLimit ? defaultConfig.rateLimit.period.replace('s', '') : '1',
    filter: val => `${val}s`,
    when: ({enableRatelimit}) => enableRatelimit,
  });
  prompts.push({
    type: 'input',
    name: 'ratelimitAverage',
    message: 'Rate-limit average request rate',
    default: defaultConfig.rateLimit ? defaultConfig.rateLimit.average : '1',
    filter: val => Number(val),
    when: ({enableRatelimit}) => enableRatelimit,
  });
  prompts.push({
    type: 'input',
    name: 'ratelimitBurst',
    message: 'Rate-limit burst request rate',
    default: defaultConfig.rateLimit ? defaultConfig.rateLimit.burst : '5',
    filter: val => Number(val),
    when: ({enableRatelimit}) => enableRatelimit,
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
  prompts.push({
    type: 'input',
    name: 'template',
    message: 'Template [optional]:',
    default: defaultConfig.template,
    filter,
  });
  // get values from user
  const {
    name,
    domain,
    project,
    env,
    labels,
    enableRatelimit,
    ratelimitPeriod,
    ratelimitAverage,
    ratelimitBurst,
    hostname,
    restart,
    template,
  } = await inquirer.prompt(prompts);
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
  if (labels && Object.keys(labels).length) {
    config.labels = labels
      .split(',')
      .map(kv => kv.split('='))
      .map(pair => ({key: pair[0].trim(), value: pair[1].trim()}))
      .reduce((prev, obj) => Object.assign(prev, {[obj.key]: obj.value}), {});
  }
  if (enableRatelimit) {
    config.rateLimit = {
      period: ratelimitPeriod,
      average: ratelimitAverage,
      burst: ratelimitBurst,
    };
  }
  if (hostname && hostname.length) {
    config.hostname = hostname;
  }
  if (template && template.length) {
    config.template = template;
  }

  // write config
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  console.log(chalk.green('Config created!'));
};
