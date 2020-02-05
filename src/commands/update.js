// npm packages
const _ = require('lodash');
const got = require('got');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');

// our packages
const {userConfig, isLoggedIn, logout} = require('../config');

// valid targets list
const validTargets = ['traefik', 'server', 'all'];
// construct shared request params
const options = {
  headers: {
    Authorization: `Bearer ${userConfig.token}`,
  },
  responseType: 'json',
};

const runUpdate = async target => {
  console.log(chalk.bold(`Updating ${target} on:`), userConfig.endpoint);

  // services request url
  const remoteUrl = `${userConfig.endpoint}/update/${target}`;
  // try sending request
  try {
    const {body, statusCode} = await got.post(remoteUrl, {...options, json: {}});
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
    if (e.response.statusCode === 401) {
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

exports.command = ['update [target]'];
exports.describe = 'check for updates or update given target';
exports.builder = {
  target: {
    alias: 't',
    description: `Target for update (${validTargets.join(', ')})`,
  },
};
exports.handler = async ({target}) => {
  if (!isLoggedIn()) {
    return;
  }

  // if no target given - check for update
  if (!target || !target.length) {
    // show loader
    const spinner = ora('Checking for update...').start();

    // services request url
    const remoteUrl = `${userConfig.endpoint}/version`;
    // send request
    const {body, statusCode} = await got.get(remoteUrl, options);
    if (statusCode !== 200 || body.error) {
      spinner.fail('Error checking for update');
      console.log(body.error || 'Oops. Something went wrong! Try again please.');
      return;
    }

    if (body.serverUpdate || body.traefikUpdate) {
      spinner.warn('Updates available!');
    } else {
      spinner.succeed('You are up to date!');
    }

    console.log();
    console.log(chalk.bold('Exoframe Server:'));
    console.log(`  current: ${body.server}`);
    console.log(`  latest: ${body.latestServer}`);
    console.log();
    console.log(chalk.bold('Traefik:'));
    console.log(`  current: ${body.traefik}`);
    console.log(`  latest: ${body.latestTraefik}`);
    console.log();

    // if updates are available - ask user if he want them immediately
    if (!body.serverUpdate && !body.traefikUpdate) {
      return;
    }

    const prompts = [];
    if (body.serverUpdate) {
      prompts.push({
        type: 'confirm',
        name: 'upServer',
        message: 'Update server now?',
        default: true,
      });
    }

    if (body.traefikUpdate) {
      prompts.push({
        type: 'confirm',
        name: 'upTraefik',
        message: 'Update Traefik now?',
        default: true,
      });
    }
    const {upServer, upTraefik} = await inquirer.prompt(prompts);
    // if user doesn't want update - just exit
    if (!upServer && !upTraefik) {
      return;
    }
    // define target based on user input
    if (upServer && upTraefik) {
      target = 'all';
    } else if (upServer) {
      target = 'server';
    } else if (upTraefik) {
      target = 'traefik';
    }
  }

  if (!validTargets.includes(target)) {
    console.log(
      chalk.red('Error!'),
      'Invalid target! Should be one of:',
      validTargets.map(it => chalk.green(it)).join(', ')
    );
    return;
  }

  // if target is all - run updates sequentially
  if (target === 'all') {
    await runUpdate('traefik');
    await runUpdate('server');
    return;
  }

  // otherwise - just run given target
  await runUpdate(target);
};
