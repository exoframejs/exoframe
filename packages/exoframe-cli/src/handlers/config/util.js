import md5 from 'apache-md5';
import chalk from 'chalk';
import { writeFile } from 'fs/promises';
import inquirer from 'inquirer';

export const writeConfig = async (configPath, newConfig) => {
  // init config object
  const config = { name: newConfig.name };
  if (newConfig.restart?.length > 0) {
    config.restart = newConfig.restart;
  }
  if (newConfig.domain?.length > 0) {
    config.domain = newConfig.domain;
  }
  if (String(newConfig.port ?? '').length) {
    config.port = String(newConfig.port);
  }
  if (newConfig.project?.length > 0) {
    config.project = newConfig.project;
  }
  // copy existing env object if present
  if (newConfig.env) {
    config.env = newConfig.env;
  }
  // update env from string if user passed one
  if (newConfig.envString?.length > 0) {
    config.env = newConfig.envString
      .split(',')
      .map((kv) => kv.split('='))
      .map((pair) => ({ key: pair[0].trim(), value: pair[1].trim() }))
      .reduce((prev, obj) => Object.assign(prev, { [obj.key]: obj.value }), {});
  }
  // copy existing middlewares object if present
  if (newConfig.middlewares) {
    config.middlewares = newConfig.middlewares;
  }
  // copy existing labels object if present
  if (newConfig.labels) {
    config.labels = newConfig.labels;
  }
  // update labels from string if user passed one
  if (newConfig.labelsString?.length > 0) {
    config.labels = newConfig.labelsString
      .split(',')
      .map((kv) => kv.split('='))
      .map((pair) => ({ key: pair[0].trim(), value: pair[1].trim() }))
      .reduce((prev, obj) => Object.assign(prev, { [obj.key]: obj.value }), {});
  }
  // copy existing volumes object if present
  if (newConfig.volumes) {
    config.volumes = newConfig.volumes;
  }
  // update volumes from string if user passed one
  if (newConfig.volumesString?.length > 0) {
    config.volumes = newConfig.volumesString.split(',').map((v) => v.trim());
  }
  // copy existing rate limit object if present and ratelimit wasn't disabled
  if (newConfig.rateLimit && newConfig.enableRatelimit === undefined) {
    config.rateLimit = newConfig.rateLimit;
  }
  // update rate limit from string if user passed one
  if (
    String(newConfig.ratelimitAverage ?? '').length > 0 &&
    String(newConfig.ratelimitBurst ?? '').length > 0 &&
    newConfig.enableRatelimit
  ) {
    config.rateLimit = {
      average: newConfig.ratelimitAverage,
      burst: newConfig.ratelimitBurst,
    };
  }
  if (newConfig.hostname?.length > 0) {
    config.hostname = newConfig.hostname;
  }
  if (newConfig.template?.length > 0) {
    config.template = newConfig.template;
  }
  if (newConfig.compress !== undefined) {
    config.compress = newConfig.compress;
  }
  if (newConfig.letsencrypt !== undefined) {
    config.letsencrypt = newConfig.letsencrypt;
  }
  if (newConfig.image?.length > 0) {
    config.image = newConfig.image;
  }
  if (newConfig.imageFile?.length > 0) {
    config.imageFile = newConfig.imageFile;
  }
  // copy existing auth object if present
  if (newConfig.basicAuth) {
    config.basicAuth = newConfig.basicAuth;
  }
  // update auth from string if user passed one
  if (newConfig.users?.length > 0) {
    config.basicAuth = newConfig.users.reduce((acc, curr, index) => {
      const delimeter = newConfig.users.length - 1 === index ? '' : ',';
      const pair = `${curr.username}:${md5(curr.password)}`;
      return `${acc}${pair}${delimeter}`;
    }, '');
  }

  // write config
  await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
  console.log(chalk.green('Config saved!'));
};

export const defaultConfigBase = {
  name: '',
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
    average: undefined,
    burst: undefined,
  },
  basicAuth: false,
  function: false,
};

const validate = (input) => input?.length > 0;
const filter = (input) => (input ? input.trim() : '');
const formatNumber = (input) => (input ? parseInt(input) : undefined);
const validateBool = (input) => ['', 'y', 'n'].includes(input);
const validateNumber = (input) => {
  if (input?.length === 0) {
    return true;
  }
  const val = parseInt(input);
  return Number.isInteger(val);
};

const pairValidation = (input) => {
  if (!input) {
    return true;
  }

  const pairs = input.split(',');
  const res = pairs.map((pair) => {
    const s = pair.split('=');
    const [key, val] = s;
    return key && val;
  });
  if (res.some((r) => !r)) {
    return `Values should be specified in 'key=val,key2=val2' format!`;
  }
  return true;
};
const volumeValidation = (input) => {
  if (!input) {
    return true;
  }

  const pairs = input.split(',');
  const res = pairs.map((pair) => {
    const s = pair.split(':');
    const [key, val] = s;
    return key && val;
  });
  if (res.some((r) => !r)) {
    return `Values should be specified in 'src:dest,src2:dest2' format!`;
  }
  return true;
};

export const configPrompts = {
  name: (config) => [
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: config.name,
      validate,
      filter,
    },
  ],
  domain: (config) => [
    {
      type: 'input',
      name: 'domain',
      message: 'Domain:',
      default: config.domain,
      filter,
    },
  ],
  port: (config) => [
    {
      type: 'input',
      name: 'port',
      message: 'Port:',
      default: config.port,
      filter,
      validate: validateNumber,
    },
  ],
  project: (config) => [
    {
      type: 'input',
      name: 'project',
      message: 'Project:',
      default: config.project,
      filter,
    },
  ],
  env: (config) => [
    {
      type: 'input',
      name: 'envString',
      message: 'Env variables:',
      default: Object.keys(config.env ?? {})
        .map((k) => `${k.toUpperCase()}=${config.env[k]}`)
        .join(', '),
      filter,
      validate: pairValidation,
    },
  ],
  labels: (config) => [
    {
      type: 'input',
      name: 'labelsString',
      message: 'Labels:',
      default: Object.keys(config.labels ?? {})
        .map((k) => `${k}=${config.labels[k]}`)
        .join(', '),
      filter,
      validate: pairValidation,
    },
  ],
  volumes: (config) => [
    {
      type: 'input',
      name: 'volumesString',
      message: 'Volumes:',
      default: config.volumes ? config.volumes.join(', ') : '',
      filter,
      validate: volumeValidation,
    },
  ],
  rateLimit: (config) => [
    {
      type: 'confirm',
      name: 'enableRatelimit',
      message: 'Enable rate-limit?',
      default: config.rateLimit && config.rateLimit.average !== undefined,
    },
    {
      type: 'input',
      name: 'ratelimitAverage',
      message: 'Rate-limit average:',
      default: config.rateLimit ? config.rateLimit.average : '',
      validate: validateNumber,
      filter: formatNumber,
      when: (answers) => answers.enableRatelimit,
    },
    {
      type: 'input',
      name: 'ratelimitBurst',
      message: 'Rate-limit burst:',
      default: config.rateLimit ? config.rateLimit.burst : '',
      validate: validateNumber,
      filter: formatNumber,
      when: (answers) => answers.enableRatelimit,
    },
  ],
  hostname: (config) => [
    {
      type: 'input',
      name: 'hostname',
      message: 'Hostname:',
      default: config.hostname,
      filter,
    },
  ],
  restart: (config) => [
    {
      type: 'list',
      name: 'restart',
      message: 'Restart policy:',
      default: config.restart,
      choices: ['', 'no', 'on-failure:2', 'always'],
      filter,
    },
  ],
  template: (config) => [
    {
      type: 'input',
      name: 'template',
      message: 'Template:',
      default: config.template,
      filter,
    },
  ],
  compress: (config) => [
    {
      type: 'confirm',
      name: 'compress',
      message: 'Compress (y/n):',
      default: config.compress ? (config.compress ? 'y' : 'n') : '',
      filter,
      validate: validateBool,
    },
  ],
  letsencrypt: (config) => [
    {
      type: 'confirm',
      name: 'letsencrypt',
      message: 'Letsencrypt (y/n):',
      default: config.letsencrypt ? (config.letsencrypt ? 'y' : 'n') : '',
      filter,
      validate: validateBool,
    },
  ],
  image: (config) => [
    {
      type: 'input',
      name: 'image',
      message: 'Deploy docker image:',
      default: config.image || '',
      filter,
    },
  ],
  imageFile: (config) => [
    {
      type: 'input',
      name: 'imageFile',
      message: 'Docker image tar file:',
      default: config.imageFile || '',
      filter,
    },
  ],
};

const expandPromptFromProp = ({ config, prop, label, isObject = false, isArray = false }) => {
  if (config[prop] === undefined) {
    return label;
  }

  let value = '';

  if (isObject) {
    value =
      Object.keys(config[prop] ?? {})
        .map((k) => `${k}=${config[prop][k]}`)
        .join(', ')
        .slice(0, 30) + '...';
  }

  if (isArray) {
    value = (config[prop] ?? []).join(', ');
  }

  if (typeof config[prop] === 'boolean' && config[prop] !== undefined) {
    value = config[prop] ? 'Yes' : 'No';
  }

  if (typeof config[prop] === 'string' || typeof config[prop] === 'number') {
    value = config[prop];
  }

  if (value.length === 0) {
    return label;
  }

  return `${label}: ${chalk.gray(value)}`;
};

export const generateConfigPrompt = (config) => {
  // console.log(config);
  // ask user for values
  // generate and show choices
  const choices = [];
  choices.push({
    key: 'n',
    name: expandPromptFromProp({ config, prop: 'name', label: 'Name' }),
    value: 'name',
  });
  choices.push({
    key: 'd',
    name: expandPromptFromProp({ config, prop: 'domain', label: 'Domain' }),
    value: 'domain',
  });
  choices.push({
    key: 'p',
    name: expandPromptFromProp({ config, prop: 'port', label: 'Port' }),
    value: 'port',
  });
  choices.push({
    key: 'j',
    name: expandPromptFromProp({ config, prop: 'project', label: 'Project' }),
    value: 'project',
  });
  choices.push({
    key: 'e',
    name: expandPromptFromProp({ config, prop: 'env', label: 'Env', isObject: true }),
    value: 'env',
  });
  choices.push({
    key: 'l',
    name: expandPromptFromProp({ config, prop: 'labels', label: 'Labels', isObject: true }),
    value: 'labels',
  });
  choices.push({
    // expand prompt
    key: 'v',
    name: expandPromptFromProp({ config, prop: 'volumes', label: 'Volumes', isArray: true }),
    value: 'volumes',
  });
  choices.push({
    key: 'm',
    name: expandPromptFromProp({ config, prop: 'rateLimit', label: 'Rate limit', isObject: true }),
    value: 'rateLimit',
  });
  choices.push({
    key: 'o',
    name: expandPromptFromProp({ config, prop: 'hostname', label: 'Hostname' }),
    value: 'hostname',
  });
  choices.push({
    key: 'r',
    name: expandPromptFromProp({ config, prop: 'restart', label: 'Restart policy' }),
    value: 'restart',
  });
  choices.push({
    key: 't',
    name: expandPromptFromProp({ config, prop: 'template', label: 'Template' }),
    value: 'template',
  });
  choices.push({
    key: 'c',
    name: expandPromptFromProp({ config, prop: 'compress', label: 'Compression' }),
    value: 'compress',
  });
  choices.push({
    key: 'y',
    name: expandPromptFromProp({ config, prop: 'letsencrypt', label: 'Letsencrypt' }),
    value: 'letsencrypt',
  });
  choices.push({
    key: 'i',
    name: expandPromptFromProp({ config, prop: 'image', label: 'Image' }),
    value: 'image',
  });
  choices.push({
    key: 'f',
    name: expandPromptFromProp({ config, prop: 'imageFile', label: 'Image file' }),
    value: 'imageFile',
  });
  choices.push(new inquirer.Separator());
  choices.push({
    key: 'x',
    name: 'Abort',
    value: 'abort',
  });

  return [
    {
      type: 'expand',
      message: 'Choose a config property to change:',
      name: 'prop',
      default: 'n',
      pageSize: 20,
      expanded: true,
      choices,
    },
  ];
};
