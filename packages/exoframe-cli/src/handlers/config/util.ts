import chalk from 'chalk';
import { writeFile } from 'fs/promises';
import inquirer from 'inquirer';
import { createRequire } from 'module';
import type { CliPromptQuestion, ProjectConfigDraft } from '../../types.ts';

const require = createRequire(import.meta.url);
const hashPassword = require('apache-md5') as (value: string) => string;

type ConfigPromptKey =
  | 'name'
  | 'domain'
  | 'port'
  | 'project'
  | 'env'
  | 'labels'
  | 'volumes'
  | 'rateLimit'
  | 'hostname'
  | 'restart'
  | 'template'
  | 'compress'
  | 'letsencrypt'
  | 'image'
  | 'imageFile';

type ExpandChoiceValue = ConfigPromptKey | 'abort';

interface ExpandPromptOptions {
  config: ProjectConfigDraft;
  prop: keyof ProjectConfigDraft;
  label: string;
  isObject?: boolean;
  isArray?: boolean;
}

const toObject = (pairs: string) =>
  pairs
    .split(',')
    .map((entry) => entry.split('='))
    .map(([key = '', value = '']) => ({ key: key.trim(), value: value.trim() }))
    .reduce<Record<string, string>>((result, entry) => Object.assign(result, { [entry.key]: entry.value }), {});

export const writeConfig = async (configPath: string, newConfig: ProjectConfigDraft) => {
  const config: ProjectConfigDraft = { name: newConfig.name };

  if (newConfig.restart?.length) {
    config.restart = newConfig.restart;
  }
  if (newConfig.domain?.length) {
    config.domain = newConfig.domain;
  }
  if (String(newConfig.port ?? '').length) {
    config.port = String(newConfig.port);
  }
  if (newConfig.project?.length) {
    config.project = newConfig.project;
  }
  if (newConfig.env) {
    config.env = newConfig.env;
  }
  if (newConfig.envString?.length) {
    config.env = toObject(newConfig.envString);
  }
  if (newConfig.middlewares) {
    config.middlewares = newConfig.middlewares;
  }
  if (newConfig.labels) {
    config.labels = newConfig.labels;
  }
  if (newConfig.labelsString?.length) {
    config.labels = toObject(newConfig.labelsString);
  }
  if (newConfig.volumes) {
    config.volumes = newConfig.volumes;
  }
  if (newConfig.volumesString?.length) {
    config.volumes = newConfig.volumesString.split(',').map((value) => value.trim());
  }
  if (newConfig.rateLimit && newConfig.enableRatelimit === undefined) {
    config.rateLimit = newConfig.rateLimit;
  }
  if (
    String(newConfig.ratelimitAverage ?? '').length &&
    String(newConfig.ratelimitBurst ?? '').length &&
    newConfig.enableRatelimit
  ) {
    config.rateLimit = {
      average: newConfig.ratelimitAverage,
      burst: newConfig.ratelimitBurst,
    };
  }
  if (newConfig.hostname?.length) {
    config.hostname = newConfig.hostname;
  }
  if (newConfig.template?.length) {
    config.template = newConfig.template;
  }
  if (newConfig.compress !== undefined) {
    config.compress = newConfig.compress;
  }
  if (newConfig.letsencrypt !== undefined) {
    config.letsencrypt = newConfig.letsencrypt;
  }
  if (newConfig.image?.length) {
    config.image = newConfig.image;
  }
  if (newConfig.imageFile?.length) {
    config.imageFile = newConfig.imageFile;
  }
  if (newConfig.basicAuth) {
    config.basicAuth = newConfig.basicAuth;
  }
  if (newConfig.users?.length) {
    config.basicAuth = newConfig.users.reduce((acc, user, index) => {
      const delimiter = newConfig.users?.length === index + 1 ? '' : ',';
      return `${acc}${user.username}:${hashPassword(user.password)}${delimiter}`;
    }, '');
  }

  await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
  console.log(chalk.green('Config saved!'));
};

export const defaultConfigBase: ProjectConfigDraft = {
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

const validate = (input: string) => input.trim().length > 0;
const filter = (input: string) => (input ? input.trim() : '');
const formatNumber = (input: string) => (input ? Number.parseInt(input, 10) : undefined);
const validateBool = (input: string) => ['', 'y', 'n'].includes(input);
const validateNumber = (input: string) => {
  if (!input.length) {
    return true;
  }

  return Number.isInteger(Number.parseInt(input, 10));
};

const pairValidation = (input: string) => {
  if (!input) {
    return true;
  }

  const valuesAreValid = input
    .split(',')
    .map((pair) => pair.split('='))
    .every(([key, value]) => Boolean(key && value));

  return valuesAreValid || `Values should be specified in 'key=val,key2=val2' format!`;
};

const volumeValidation = (input: string) => {
  if (!input) {
    return true;
  }

  const valuesAreValid = input
    .split(',')
    .map((pair) => pair.split(':'))
    .every(([source, destination]) => Boolean(source && destination));

  return valuesAreValid || `Values should be specified in 'src:dest,src2:dest2' format!`;
};

export const configPrompts: Record<ConfigPromptKey, (config: ProjectConfigDraft) => CliPromptQuestion[]> = {
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
      default: config.domain ?? '',
      filter,
    },
  ],
  port: (config) => [
    {
      type: 'input',
      name: 'port',
      message: 'Port:',
      default: config.port ?? '',
      filter,
      validate: validateNumber,
    },
  ],
  project: (config) => [
    {
      type: 'input',
      name: 'project',
      message: 'Project:',
      default: config.project ?? '',
      filter,
    },
  ],
  env: (config) => [
    {
      type: 'input',
      name: 'envString',
      message: 'Env variables:',
      default: Object.keys(config.env ?? {})
        .map((key) => `${key.toUpperCase()}=${config.env?.[key] ?? ''}`)
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
        .map((key) => `${key}=${config.labels?.[key] ?? ''}`)
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
      default: config.volumes?.join(', ') ?? '',
      filter,
      validate: volumeValidation,
    },
  ],
  rateLimit: (config) => [
    {
      type: 'confirm',
      name: 'enableRatelimit',
      message: 'Enable rate-limit?',
      default: config.rateLimit?.average !== undefined,
    },
    {
      type: 'input',
      name: 'ratelimitAverage',
      message: 'Rate-limit average:',
      default: config.rateLimit?.average ?? '',
      validate: validateNumber,
      filter: formatNumber,
      when: (answers) => Boolean(answers.enableRatelimit),
    },
    {
      type: 'input',
      name: 'ratelimitBurst',
      message: 'Rate-limit burst:',
      default: config.rateLimit?.burst ?? '',
      validate: validateNumber,
      filter: formatNumber,
      when: (answers) => Boolean(answers.enableRatelimit),
    },
  ],
  hostname: (config) => [
    {
      type: 'input',
      name: 'hostname',
      message: 'Hostname:',
      default: config.hostname ?? '',
      filter,
    },
  ],
  restart: (config) => [
    {
      type: 'select',
      name: 'restart',
      message: 'Restart policy:',
      default: config.restart ?? '',
      choices: ['', 'no', 'on-failure:2', 'always'],
      filter,
    },
  ],
  template: (config) => [
    {
      type: 'input',
      name: 'template',
      message: 'Template:',
      default: config.template ?? '',
      filter,
    },
  ],
  compress: (config) => [
    {
      type: 'confirm',
      name: 'compress',
      message: 'Compress (y/n):',
      default: config.compress ?? false,
      filter,
      validate: validateBool,
    },
  ],
  letsencrypt: (config) => [
    {
      type: 'confirm',
      name: 'letsencrypt',
      message: 'Letsencrypt (y/n):',
      default: config.letsencrypt ?? false,
      filter,
      validate: validateBool,
    },
  ],
  image: (config) => [
    {
      type: 'input',
      name: 'image',
      message: 'Deploy docker image:',
      default: config.image ?? '',
      filter,
    },
  ],
  imageFile: (config) => [
    {
      type: 'input',
      name: 'imageFile',
      message: 'Docker image tar file:',
      default: config.imageFile ?? '',
      filter,
    },
  ],
};

const expandPromptFromProp = ({ config, prop, label, isObject = false, isArray = false }: ExpandPromptOptions) => {
  const valueAtProp = config[prop];
  if (valueAtProp === undefined) {
    return label;
  }

  let value = '';

  if (isObject && valueAtProp && typeof valueAtProp === 'object' && !Array.isArray(valueAtProp)) {
    value = `${Object.entries(valueAtProp)
      .map(([key, entryValue]) => `${key}=${String(entryValue)}`)
      .join(', ')
      .slice(0, 30)}...`;
  }

  if (isArray && Array.isArray(valueAtProp)) {
    value = valueAtProp.join(', ');
  }

  if (typeof valueAtProp === 'boolean') {
    value = valueAtProp ? 'Yes' : 'No';
  }

  if (typeof valueAtProp === 'string' || typeof valueAtProp === 'number') {
    value = String(valueAtProp);
  }

  return value.length ? `${label}: ${chalk.gray(value)}` : label;
};

export const generateConfigPrompt = (config: ProjectConfigDraft): CliPromptQuestion[] => {
  const choices: Array<{ key: string; name: string; value: ExpandChoiceValue } | InstanceType<typeof inquirer.Separator>> =
    [];

  choices.push({ key: 'n', name: expandPromptFromProp({ config, prop: 'name', label: 'Name' }), value: 'name' });
  choices.push({
    key: 'd',
    name: expandPromptFromProp({ config, prop: 'domain', label: 'Domain' }),
    value: 'domain',
  });
  choices.push({ key: 'p', name: expandPromptFromProp({ config, prop: 'port', label: 'Port' }), value: 'port' });
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
  choices.push({ key: 'i', name: expandPromptFromProp({ config, prop: 'image', label: 'Image' }), value: 'image' });
  choices.push({
    key: 'f',
    name: expandPromptFromProp({ config, prop: 'imageFile', label: 'Image file' }),
    value: 'imageFile',
  });
  choices.push(new inquirer.Separator());
  choices.push({ key: 'x', name: 'Abort', value: 'abort' });

  return [
    {
      type: 'expand',
      message: 'Choose a config property to change:',
      name: 'prop',
      default: 'n',
      pageSize: 20,
      choices,
    },
  ];
};
