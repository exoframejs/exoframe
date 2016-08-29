import inquirer from 'inquirer';
import got from 'got';

export default (yargs) =>
  yargs.command('login [url]', 'login into exoframe server', {
    url: {
      default: 'http://localhost:5000/',
    },
  }, async ({url}) => {
    console.log('logging in to', url);
    const prompts = [];
    prompts.push({
      type: 'input',
      name: 'username',
      message: 'Login:',
      validate: (input) => input && input.length > 0,
    });
    prompts.push({
      type: 'input',
      name: 'password',
      message: 'Password:',
      validate: (input) => input && input.length > 0,
    });

    const {username, password} = await inquirer.prompt(prompts);
    console.log('user answers:', username, password);

    const remoteUrl = `${url.replace(/\/$/, '')}/api/login`;
    try {
      const {body} = await got(remoteUrl, {body: {username, password}});
      console.log('auth result:', body);
    } catch (e) {
      console.log('Error logging in! Try again?');
    }
  });
