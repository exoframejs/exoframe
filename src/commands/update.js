// npm packages
const _ = require('lodash');
const got = require('got');
const chalk = require('chalk');

// our packages
const {userConfig, isLoggedIn, logout} = require('../config');

// valid targets list
const validTargets = ['traefik', 'server'];

exports.command = ['update [target]'];
exports.describe = 'update given target';
exports.builder = {
  target: {
    alias: 't',
    description: `Target for update (${validTargets.join(', ')})`,
  },
};
exports.handler = async ({target} = {target: 'self'}) => {
  if (!isLoggedIn()) {
    return;
  }

  if (!validTargets.includes(target)) {
    console.log(
      chalk.red('Error!'),
      'Invalid target! Should be one of:',
      validTargets.map(it => chalk.green(it)).join(', ')
    );
    return;
  }

  console.log(chalk.bold(`Updating ${target} on:`), userConfig.endpoint);

  // services request url
  const remoteUrl = `${userConfig.endpoint}/update/${target}`;
  // construct shared request params
  const options = {
    headers: {
      Authorization: `Bearer ${userConfig.token}`,
    },
    json: true,
  };
  // try sending request
  try {
    const {body, statusCode} = await got.post(remoteUrl, options);
    if (statusCode !== 200 || body.error) {
      throw new Error(body.error || 'Oops. Something went wrong! Try again please.');
    }

    if (body.updated) {
      console.log(chalk.green(`Successfully updated ${target}!`));
      return;
    }

    console.log(chalk.green(`${_.capitalize(target)} is already up to date!`));
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.statusCode === 401) {
      logout(userConfig);
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    const reason = e.response.body && e.response.body.error ? e.response.body.error : e.toString();
    console.log(chalk.red(`Error updating ${target}:`), reason);
    console.log('Update log:\n');
    (e.response.body.log || 'No log available')
      .split('\n')
      .map(l => {
        try {
          return JSON.parse(l);
        } catch (e) {
          return l;
        }
      })
      .filter(l => l !== undefined)
      .map(l => l.trim())
      .filter(l => l && l.length > 0)
      .forEach(line => console.log(line));
  }
};
