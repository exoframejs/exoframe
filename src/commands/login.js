// npm packages
const fs = require('fs');
const os = require('os');
const path = require('path');
const chalk = require('chalk');
const got = require('got');
const inquirer = require('inquirer');
const jwt = require('jsonwebtoken');

// our packages
const {userConfig, updateConfig} = require('../config');

const validate = input => input && input.length > 0;
const filter = input => input.trim();

exports.command = 'login';
exports.describe = 'login into exoframe server';
exports.builder = {
  key: {
    alias: 'k',
    description: 'User private key used for authentication',
  },
  passphrase: {
    alias: 'p',
    description: 'Passphrase for user private key (if set)',
  },
};
exports.handler = async ({key, passphrase}) => {
  console.log(chalk.bold('Logging in to:'), userConfig.endpoint);

  // get user private keys
  const noKey = !key || !key.length;
  let privateKeys = [];
  const sshFolder = path.join(os.homedir(), '.ssh');
  if (noKey) {
    try {
      const allFiles = fs.readdirSync(sshFolder);
      const filterOut = ['authorized_keys', 'config', 'known_hosts'];
      privateKeys = allFiles.filter(f => !f.endsWith('.pub') && !filterOut.includes(f));
    } catch (e) {
      console.log(chalk.red('Error logging in!'), 'Default folder (~/.ssh) with private keys does not exists!');
      return;
    }
  }

  // generate and show choices
  const prompts = [];
  prompts.push({
    type: 'input',
    name: 'username',
    message: 'Username:',
    validate,
    filter,
  });
  // only ask for key if no user key given
  if (noKey) {
    prompts.push({
      type: 'list',
      name: 'privateKeyName',
      message: 'Private key:',
      choices: privateKeys,
    });
    prompts.push({
      type: 'password',
      name: 'password',
      message: 'Private key passpharse (leave blank if not set):',
    });
  }

  // get username, key filename, password and generate key path
  const {username, privateKeyName, password: userPass} = await inquirer.prompt(prompts);
  const password = passphrase || userPass;
  const privateKey = noKey ? path.join(sshFolder, privateKeyName) : key;

  // generate login url
  const remoteUrl = `${userConfig.endpoint}/login`;

  // get login request phrase and ID from server
  let phrase;
  let loginReqId;
  try {
    const {body} = await got(remoteUrl, {json: true});
    phrase = body.phrase;
    loginReqId = body.uid;
    if (!phrase || !loginReqId) {
      console.log(
        chalk.red('Error logging in!'),
        'Error getting login request phrase. Server did not return correct values!'
      );
      return;
    }
  } catch (e) {
    console.log(
      chalk.red('Error logging in!'),
      'Error getting login request phrase. Make sure your endpoint is correct!',
      e.toString()
    );
    return;
  }

  // generate login token based on phrase from server
  let reqToken;
  try {
    const cert =
      password && password.length
        ? {key: fs.readFileSync(privateKey), passphrase: password}
        : fs.readFileSync(privateKey);
    reqToken = jwt.sign(phrase, cert, {algorithm: 'RS256'});
  } catch (e) {
    console.log(
      chalk.red('Error logging in!'),
      'Error generating login token! Make sure your private key password is correct',
      e.toString()
    );
    return;
  }

  if (!reqToken) {
    console.log(
      chalk.red('Error logging in!'),
      'Error generating login token! Something went wrong, please try again.'
    );
    return;
  }

  // send login request
  try {
    const user = {username};
    const {body} = await got(remoteUrl, {
      body: {
        user,
        token: reqToken,
        requestId: loginReqId,
      },
      json: true,
    });
    // check for errors
    if (!body || !body.token) {
      throw new Error('Error logging in!');
    }
    updateConfig(Object.assign(body, {user}));
    console.log(chalk.green('Successfully logged in!'));
  } catch (e) {
    console.log(chalk.red('Error logging in!'), 'Check your username and password and try again.', e.toString());
  }
};
