import chalk from 'chalk';
import { readFile, stat } from 'fs/promises';
import inquirer from 'inquirer';
import path from 'path';
import type { BasicAuthUser, CliPromptQuestion, ProjectConfigDraft } from '../../types.ts';
import { defaultConfigBase, writeConfig } from './util.ts';

const validate = (input: string) => input.trim().length > 0;
const format = (input: string) => (input ? input.trim() : '');

const generatePrompts = () => {
  const recursivePrompts: CliPromptQuestion[] = [
    {
      type: 'input',
      name: 'username',
      message: 'Username for Basic Auth:',
      filter: format,
      validate,
    },
    {
      type: 'password',
      name: 'password',
      message: 'Password for Basic auth:',
      filter: format,
      validate,
    },
    {
      type: 'confirm',
      name: 'askAgain',
      message: 'Add another user?',
      default: false,
    },
  ];

  const askForUsers = async (users: BasicAuthUser[] = []): Promise<BasicAuthUser[]> => {
    const { username, password, askAgain } = await inquirer.prompt(recursivePrompts);
    users.push({ username: String(username), password: String(password) });
    if (askAgain) {
      return askForUsers(users);
    }
    return users;
  };

  return askForUsers;
};

interface ConfigAuthArgs {
  user?: string;
  pass?: string;
}

export const configAuthHandler = async (args: ConfigAuthArgs) => {
  const { user, pass } = args;

  const workdir = process.cwd();
  const folderName = path.basename(workdir);
  const nonInteractive = Object.keys(args).some((key) => String(args[key]).length > 0);
  const configPath = path.join(workdir, 'exoframe.json');
  let defaultConfig: ProjectConfigDraft = {
    ...defaultConfigBase,
    name: folderName,
  };
  try {
    await stat(configPath);
    console.log(chalk.green('Config already exists! Editing..'));
    defaultConfig = JSON.parse(await readFile(configPath, 'utf-8')) as ProjectConfigDraft;
  } catch (e) {
    // check if config didn't exist
    if (e instanceof Error && e.message.includes('ENOENT')) {
      console.log('Creating new config..');
    } else {
      // if parsing fails - show message and die
      console.log(chalk.red('Error parsing existing config! Please make sure it is valid and try again.'));
      return;
    }
  }

  const newConfig = defaultConfig;
  if (nonInteractive) {
    if (!user || !pass) {
      console.log(chalk.red('Error!'), 'Both username and password are required in non-interactive mode.');
      return;
    }
    console.log(chalk.yellow('Mode changed to'), 'non-interactive');
    newConfig.users = [{ username: user, password: pass }];
  }

  if (!nonInteractive) {
    const askForUsers = generatePrompts();
    const res = await askForUsers([]);
    // get values from user
    newConfig.users = res;
  }

  await writeConfig(configPath, { ...defaultConfig, ...newConfig });
};
