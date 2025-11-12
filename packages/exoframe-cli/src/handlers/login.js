import chalk from 'chalk';
import { executeLogin as executeExoLogin } from 'exoframe-client';
import { readdir } from 'fs/promises';
import inquirer from 'inquirer';
import os from 'os';
import path from 'path';
import { getConfig, updateConfig } from '../config/index.js';
import { changeEndpoint } from './endpoint.js';

const validate = (input) => input && input.length > 0;
const format = (input) => input.trim();

const sshFolder = path.join(os.homedir(), '.ssh');

async function getKeys() {
  // get user private keys
  try {
    const allFiles = await readdir(sshFolder);
    const filterOut = ['authorized_keys', 'config', 'known_hosts'];
    const privateKeys = allFiles.filter((f) => !f.endsWith('.pub') && !filterOut.includes(f));
    return privateKeys.map((key) => `${sshFolder}/${key}`);
  } catch {
    throw new Error('Could not get private keys!');
  }
}

async function executeLogin({ endpoint, username, keyPath, passphrase }) {
  const user = { username };
  const { token } = await executeExoLogin({ endpoint, keyPath, username, passphrase });
  updateConfig({ token, user });
}

export const loginHandler = async ({ key, passphrase, url }) => {
  // if endpoint URL is given - change it in config
  if (url && url.length) {
    await changeEndpoint(url);
  }

  // get user config
  const userConfig = await getConfig();

  // log the endpoint we'll be using
  console.log(chalk.bold('Logging in to:'), userConfig.endpoint);

  // get user private keys
  const noKey = !key?.length;
  let privateKeys = [];
  if (noKey) {
    try {
      privateKeys = await getKeys();
    } catch {
      console.log(chalk.red('Error logging in!'), 'Default folder (~/.ssh) with private keys does not exists!');
      return;
    }
  }

  // generate and show choices
  const prompts = [];
  prompts.push({ type: 'input', name: 'username', message: 'Username:', validate, format });
  // only ask for key if no user key given
  if (noKey) {
    prompts.push({ type: 'list', name: 'privateKeyName', message: 'Private key:', choices: privateKeys });
    prompts.push({ type: 'password', name: 'password', message: 'Private key passpharse (leave blank if not set):' });
  }

  // get username, key filename, password and generate key path
  const { username, privateKeyName, password: userPass } = await inquirer.prompt(prompts);
  const password = passphrase || userPass;
  const privateKey = noKey ? privateKeyName : key;

  try {
    await executeLogin({ endpoint: userConfig.endpoint, username, keyPath: privateKey, passphrase: password });
    console.log(chalk.green('Successfully logged in!'));
  } catch (e) {
    console.log(chalk.red('Error logging in!'), e.toString());
  }
};
