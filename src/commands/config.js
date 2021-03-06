// npm packages
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const md5 = require('apache-md5');

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
    return `Values should be specified in 'key=val,key2=val2' format!`;
  }
  return true;
};

const volumeValidation = input => {
  if (!input) {
    return true;
  }

  const pairs = input.split(',');
  const res = pairs.map(pair => {
    const s = pair.split(':');
    const [key, val] = s;
    return key && val;
  });
  if (res.some(r => !r)) {
    return `Values should be specified in 'src:dest,src2:dest2' format!`;
  }
  return true;
};

const writeConfig = (configPath, newConfig) => {
  // init config object
  const config = {name: newConfig.name};
  if (newConfig.restart && newConfig.restart.length) {
    config.restart = newConfig.restart;
  }
  if (newConfig.domain && newConfig.domain.length) {
    config.domain = newConfig.domain;
  }
  if (newConfig.port && String(newConfig.port).length) {
    config.port = String(newConfig.port);
  }
  if (newConfig.project && newConfig.project.length) {
    config.project = newConfig.project;
  }
  if (newConfig.env && newConfig.env.length) {
    config.env = newConfig.env
      .split(',')
      .map(kv => kv.split('='))
      .map(pair => ({key: pair[0].trim(), value: pair[1].trim()}))
      .reduce((prev, obj) => Object.assign(prev, {[obj.key]: obj.value}), {});
  }
  if (newConfig.labels && Object.keys(newConfig.labels).length) {
    config.labels = newConfig.labels
      .split(',')
      .map(kv => kv.split('='))
      .map(pair => ({key: pair[0].trim(), value: pair[1].trim()}))
      .reduce((prev, obj) => Object.assign(prev, {[obj.key]: obj.value}), {});
  }
  if (newConfig.volumes && newConfig.volumes.length) {
    config.volumes = newConfig.volumes.split(',').map(v => v.trim());
  }
  if (newConfig.enableRatelimit) {
    config.rateLimit = {
      average: newConfig.ratelimitAverage,
      burst: newConfig.ratelimitBurst,
    };
  }
  if (newConfig.hostname && newConfig.hostname.length) {
    config.hostname = newConfig.hostname;
  }
  if (newConfig.template && newConfig.template.length) {
    config.template = newConfig.template;
  }
  if (newConfig.compress !== undefined) {
    config.compress = newConfig.compress;
  }
  if (newConfig.letsencrypt !== undefined) {
    config.letsencrypt = newConfig.letsencrypt;
  }
  if (newConfig.image && newConfig.image.length) {
    config.image = newConfig.image;
  }
  if (newConfig.imageFile && newConfig.imageFile.length) {
    config.imageFile = newConfig.imageFile;
  }
  if (newConfig.users && newConfig.users.length !== 0) {
    config.basicAuth = newConfig.users.reduce((acc, curr, index) => {
      const delimeter = newConfig.users.length - 1 === index ? '' : ',';
      const pair = `${curr.username}:${md5(curr.password)}`;
      return `${acc}${pair}${delimeter}`;
    }, '');
  }
  if (newConfig.function) {
    if (
      (newConfig.functionType && newConfig.functionType.length !== 0) ||
      (newConfig.functionRoute && newConfig.functionRoute.length !== 0)
    ) {
      config.function = {};
      if (newConfig.functionType && newConfig.functionType.length !== 0) {
        config.function.type = newConfig.functionType;
      }
      if (newConfig.functionRoute && newConfig.functionRoute.length !== 0) {
        config.function.route = newConfig.functionRoute;
      }
    } else {
      config.function = newConfig.function;
    }
  }

  // write config
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  console.log(chalk.green('Config created!'));
};

const generatePrompts = defaultConfig => {
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

  // function deployment part
  prompts.push({
    type: 'confirm',
    name: 'function',
    message: 'Deploy as function? [optional]:',
    default: Boolean(defaultConfig.function),
  });
  prompts.push({
    type: 'input',
    name: 'functionType',
    message: 'Function type [http, worker, trigger, custom]:',
    default: defaultConfig.function && defaultConfig.function.type ? defaultConfig.function.type : 'http',
    filter,
    when: answers => answers.function,
  });
  prompts.push({
    type: 'input',
    name: 'functionRoute',
    message: 'Function route [optional]:',
    default: defaultConfig.function && defaultConfig.function.route ? defaultConfig.function.route : '',
    filter,
    when: answers => answers.function,
  });

  // default stuff
  prompts.push({
    type: 'input',
    name: 'domain',
    message: 'Domain [optional]:',
    default: defaultConfig.domain,
    filter,
    when: answers => !answers.function,
  });
  prompts.push({
    type: 'input',
    name: 'port',
    message: 'Port [optional]:',
    default: defaultConfig.port,
    filter,
    when: answers => !answers.function,
  });
  prompts.push({
    type: 'input',
    name: 'project',
    message: 'Project [optional]:',
    default: defaultConfig.project,
    filter,
    when: answers => !answers.function,
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
    when: answers => !answers.function,
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
    when: answers => !answers.function,
  });
  prompts.push({
    type: 'input',
    name: 'volumes',
    message: 'Volumes [comma-separated, optional]:',
    default: defaultConfig.volumes ? defaultConfig.volumes.join(', ') : '',
    filter,
    validate: volumeValidation,
    when: answers => !answers.function,
  });
  prompts.push({
    type: 'confirm',
    name: 'enableRatelimit',
    message: 'Enable rate-limit? [optional]',
    default: defaultConfig.rateLimit && defaultConfig.rateLimit.enabled,
    when: answers => !answers.function,
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
    when: answers => !answers.function,
  });
  prompts.push({
    type: 'list',
    name: 'restart',
    message: 'Restart policy [optional]:',
    default: defaultConfig.restart,
    choices: ['', 'no', 'on-failure:2', 'always'],
    when: answers => !answers.function,
  });
  prompts.push({
    type: 'input',
    name: 'template',
    message: 'Template [optional]:',
    default: defaultConfig.template,
    filter,
    when: answers => !answers.function,
  });
  prompts.push({
    type: 'confirm',
    name: 'compress',
    message: 'Compress [optional]:',
    default: Boolean(defaultConfig.compress),
    filter,
    when: answers => !answers.function,
  });
  prompts.push({
    type: 'confirm',
    name: 'letsencrypt',
    message: 'Enable letsencrypt [optional]:',
    default: Boolean(defaultConfig.letsencrypt),
    filter,
    when: answers => !answers.function,
  });
  // docker image deployment part
  prompts.push({
    type: 'confirm',
    name: 'deployWithImage',
    message: 'Deploy using docker image? [optional]:',
    default: Boolean(defaultConfig.image),
    when: answers => !answers.function,
  });
  prompts.push({
    type: 'input',
    name: 'image',
    message: 'Deploy using docker image:',
    default: defaultConfig.image || '',
    filter,
    when: ({deployWithImage}) => deployWithImage,
  });
  prompts.push({
    type: 'input',
    name: 'imageFile',
    message: 'Load docker image from tar file [optional]:',
    default: defaultConfig.imageFile || '',
    filter,
    when: ({deployWithImage}) => deployWithImage,
  });

  // basic auth part
  prompts.push({
    type: 'confirm',
    name: 'basicAuth',
    message: 'Add a basic auth user? [optional]:',
    default: Boolean(defaultConfig.basicAuth),
    when: answers => !answers.function,
  });
  // prompts for recursive questions
  const recursivePrompts = [];
  recursivePrompts.push({
    type: 'input',
    name: 'username',
    message: 'Username for Basic Auth:',
    filter,
    validate,
  });
  recursivePrompts.push({
    type: 'password',
    name: 'password',
    message: 'Password for Basic auth:',
    filter,
    validate,
  });
  recursivePrompts.push({
    type: 'confirm',
    name: 'askAgain',
    message: 'Add another user?',
    default: false,
  });

  const askForUsers = async (users = []) => {
    const {username, password, askAgain} = await inquirer.prompt(recursivePrompts);
    users.push({username, password});
    if (askAgain) {
      return askForUsers(users);
    } else {
      return users;
    }
  };

  return {prompts, askForUsers};
};

exports.command = ['config', 'init'];
exports.describe = 'generate new config file for current project';
exports.builder = {
  func: {
    alias: 'f',
    description: 'generate a new config for function deployment',
  },
  domain: {
    alias: 'd',
    description: 'sets the domain (enables non-interactive mode)',
  },
  port: {
    description: 'sets port (enables non-interactive mode)',
  },
  project: {
    alias: 'p',
    description: 'sets the project name (enables non-interactive mode)',
  },
  name: {
    alias: 'n',
    description: 'sets the name (enables non-interactive mode)',
  },
  restart: {
    alias: 'r',
    description: 'sets the restart option (enables non-interactive mode)',
  },
  hostname: {
    description: 'sets the hostname (enables non-interactive mode)',
  },
};
exports.handler = async ({_, $0, func, ...args} = {}) => {
  const workdir = process.cwd();
  const folderName = path.basename(workdir);
  const nonInteractive = Object.keys(args).some(key => String(args[key]).length > 0);
  const configPath = path.join(workdir, 'exoframe.json');
  let defaultConfig = {
    name: folderName,
    domain: '',
    port: '',
    project: '',
    restart: '',
    env: undefined,
    labels: undefined,
    hostname: '',
    template: '',
    compress: undefined,
    letsencrypt: undefined,
    rateLimit: {
      enabled: false,
      average: 1,
      burst: 5,
    },
    basicAuth: false,
    function: false,
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

  if (func) {
    console.log('Creating new config for function deployment..');
    // set function flag to true
    defaultConfig.function = true;
    // write config to file
    writeConfig(configPath, defaultConfig);
    return;
  }

  let newConfig = defaultConfig;

  if (nonInteractive) {
    console.log(chalk.yellow('Mode changed to'), 'non-interactive');
  }

  const overrideFromArgument = (key, value) => {
    if (!value) return;
    console.log('Setting', chalk.red(key), 'to', chalk.yellow(value));
    newConfig[key] = value;
  };

  overrideFromArgument('domain', args.domain);
  overrideFromArgument('port', args.port);
  overrideFromArgument('name', args.name);
  overrideFromArgument('project', args.project);
  overrideFromArgument('restart', args.restart);
  overrideFromArgument('hostname', args.hostname);

  if (!nonInteractive) {
    const {prompts, askForUsers} = generatePrompts(defaultConfig);
    // get values from user
    newConfig = await inquirer.prompt(prompts);

    // update users for auth if needed
    if (newConfig.basicAuth) {
      newConfig.users = await askForUsers();
    }
  }

  writeConfig(configPath, {...defaultConfig, ...newConfig});
};
