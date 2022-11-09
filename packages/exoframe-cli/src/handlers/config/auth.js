import chalk from 'chalk';
import { readFile, stat } from 'fs/promises';
import inquirer from 'inquirer';
import path from 'path';
import { defaultConfigBase, writeConfig } from './util.js';

const validate = (input) => input && input.length > 0;
const format = (input) => (input ? input.trim() : '');

const generatePrompts = () => {
  // prompts for recursive questions
  const recursivePrompts = [];
  recursivePrompts.push({
    type: 'input',
    name: 'username',
    message: 'Username for Basic Auth:',
    filter: format,
    validate,
  });
  recursivePrompts.push({
    type: 'password',
    name: 'password',
    message: 'Password for Basic auth:',
    filter: format,
    validate,
  });
  recursivePrompts.push({
    type: 'confirm',
    name: 'askAgain',
    message: 'Add another user?',
    default: false,
  });

  const askForUsers = async (users = []) => {
    const { username, password, askAgain } = await inquirer.prompt(recursivePrompts);
    users.push({ username, password });
    if (askAgain) {
      return askForUsers(users);
    } else {
      return users;
    }
  };

  return askForUsers;
};

export const configAuthHandler = async (args) => {
  const { user, pass } = args;

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

  const newConfig = defaultConfig;
  if (nonInteractive) {
    console.log(chalk.yellow('Mode changed to'), 'non-interactive');
    newConfig.users = [{ username: user, password: pass }];
  }

  if (!nonInteractive) {
    const askForUsers = generatePrompts();
    const res = await askForUsers([]);
    // get values from user
    newConfig.users = res;
  }

  writeConfig(configPath, { ...defaultConfig, ...newConfig });
};
