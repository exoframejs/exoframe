import chalk from 'chalk';
import { readFile, stat } from 'fs/promises';
import inquirer from 'inquirer';
import path from 'path';
import { configPrompts, defaultConfigBase, generateConfigPrompt, writeConfig } from './util.js';

export const configHandler = async (args) => {
  // console.log(args);
  const { domain, port, project, name, restart, hostname } = args;

  const workdir = process.cwd();
  const folderName = path.basename(workdir);
  const nonInteractive = Object.keys(args).some((key) => String(args[key]).length > 0);
  const configPath = path.join(workdir, 'exoframe.json');
  let defaultConfig = {
    ...defaultConfigBase,
    name: folderName,
  };
  try {
    await stat(configPath);
    console.log(chalk.green('Config already exists! Editing..'));
    defaultConfig = JSON.parse(await readFile(configPath, 'utf-8'));
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

  const newConfig = { ...defaultConfig };
  if (nonInteractive) {
    console.log(chalk.yellow('Mode changed to'), 'non-interactive');
  }

  const overrideFromArgument = (key, value) => {
    if (!value) return;
    console.log('Setting', chalk.red(key), 'to', chalk.yellow(value));
    newConfig[key] = value;
  };

  // override from args if needed
  overrideFromArgument('domain', domain);
  overrideFromArgument('port', port);
  overrideFromArgument('name', name);
  overrideFromArgument('project', project);
  overrideFromArgument('restart', restart);
  overrideFromArgument('hostname', hostname);

  if (!nonInteractive) {
    const cfgPrompts = generateConfigPrompt(newConfig);
    const { prop } = await inquirer.prompt(cfgPrompts);
    // create new prompt for specific prop chosen by user
    const propPrompts = configPrompts[prop](newConfig);
    const res = await inquirer.prompt(propPrompts);
    // write values to new config
    for (const prop of Object.keys(res)) {
      newConfig[prop] = res[prop];
    }
  }

  // save config to file
  writeConfig(configPath, { ...defaultConfig, ...newConfig });
};
