import chalk from 'chalk';
import { checkUpdates, executeUpdate } from 'exoframe-client';
import inquirer from 'inquirer';
import ora from 'ora';
import { getConfig, isLoggedIn, logout } from '../config/index.js';

export const updateHandler = async (target) => {
  if (!isLoggedIn()) {
    console.log(chalk.red('Error: not logged in!'), 'Please, login and try again.');
    return;
  }

  // get user config
  const userConfig = getConfig();

  // get current endpoint and auth token
  const { endpoint, token } = userConfig;

  // show loader
  const spinner = ora('Checking for updates...').start();

  try {
    const updates = await checkUpdates({ endpoint, token });

    if (updates.serverUpdate || updates.traefikUpdate) {
      spinner.warn('Updates available!');
    } else {
      spinner.succeed('You are up to date!');
      return;
    }

    console.log();
    console.log(chalk.bold('Exoframe Server:'));
    console.log(`  current: ${updates.server}`);
    console.log(`  latest: ${updates.latestServer}`);
    console.log();
    console.log(chalk.bold('Traefik:'));
    console.log(`  current: ${updates.traefik}`);
    console.log(`  latest: ${updates.latestTraefik}`);
    console.log();

    // get values from target arg if passed
    let upServer = target === 'server' || target === 'all';
    let upTraefik = target === 'traefik' || target === 'all';

    // if target not passed - ask interactively
    if (!target) {
      const prompts = [];
      if (updates.serverUpdate) {
        prompts.push({
          type: 'confirm',
          name: 'upServer',
          message: 'Update server now?',
          default: true,
        });
      }
      if (updates.traefikUpdate) {
        prompts.push({
          type: 'confirm',
          name: 'upTraefik',
          message: 'Update Traefik now?',
          default: true,
        });
      }
      ({ upServer, upTraefik } = await inquirer.prompt(prompts));
    }

    // if user doesn't want update - just exit
    if (!upServer && !upTraefik) {
      console.log('Nothing selected for update, exiting...');
      return;
    }

    // define target based on user input
    if (upServer && upTraefik) {
      console.log(chalk.bold(`Updating all services...`));
      await executeUpdate({ target: 'traefik', endpoint, token });
      await executeUpdate({ target: 'server', endpoint, token });
      console.log(chalk.green(`All services updated!`));
      return;
    }

    // update server
    if (upServer) {
      console.log(chalk.bold(`Updating exoframe server...`));
      await executeUpdate({ target: 'server', endpoint, token });
      console.log(chalk.green(`Exoframe server updated!`));
      return;
    }

    // update traefik
    if (upTraefik) {
      console.log(chalk.bold(`Updating traefik...`));
      await executeUpdate({ target: 'traefik', endpoint, token });
      console.log(chalk.green(`Traefik updated!`));
    }
  } catch (e) {
    spinner.fail('Update failed!');
    // if authorization is expired/broken/etc
    if (e.message === 'Authorization expired!') {
      logout(userConfig);
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error executing deployment recipe:'), e.toString());
  }
};
