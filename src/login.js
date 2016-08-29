// npm packages
import chalk from 'chalk';
import got from 'got';
import inquirer from 'inquirer';

// our packages
import config, {updateConfig} from './config';

const validate = input => input && input.length > 0;
const filter = input => input.trim();

export default (yargs) =>
  yargs.command('login [url]', 'login into exoframe server', {
    url: {
      default: config.endpoint,
    },
  }, async ({url}) => {
    console.log(chalk.bold('Logging in to:'), url);
    const prompts = [];
    prompts.push({
      type: 'input',
      name: 'username',
      message: 'Login:',
      validate,
      filter,
    });
    prompts.push({
      type: 'password',
      name: 'password',
      message: 'Password:',
      validate,
    });

    const {username, password} = await inquirer.prompt(prompts);

    const remoteUrl = `${url.replace(/\/$/, '')}/api/login`;
    try {
      const {body} = await got(remoteUrl, {body: {username, password}, json: true});
      // check for errors
      if (!body || !body.token || !body.user) {
        throw new Error('Error logging in!');
      }
      updateConfig(body);
      console.log(chalk.green('Successfully logged in!'));
    } catch (e) {
      console.error(e);
      console.log(chalk.red('Error logging in!'), 'Check your username and password and try again.');
    }
  });
