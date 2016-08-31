// npm packages
import chalk from 'chalk';
import got from 'got';

// our packages
import config from './config';
import {handleError} from './error';

export default (yargs) =>
  yargs.command('deploy <image>', 'deploy image on exoframe server', {
    ports: {
      alias: 'p',
    },
    labels: {
      alias: 'l',
    },
  }, async ({image, ports: textPorts, labels: textLabels}) => {
    console.log(chalk.bold('Deploying:'), image, 'on', config.endpoint);
    // convert ports and labels to needed formats
    const ports = (Array.isArray(textPorts) ? textPorts : [textPorts]).filter(l => l !== undefined);
    const labels = (Array.isArray(textLabels) ? textLabels : [textLabels])
    .filter(l => l !== undefined)
    .map(l => {
      const [k, v] = l.split('=');
      if (!k || !v) {
        return undefined;
      }
      return {key: k, value: v};
    }).filter(l => l !== undefined);
    const options = {
      headers: {
        'x-access-token': config.token,
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        services: [{name: image, ports, labels}],
      }),
      json: true,
    };
    const remoteUrl = `${config.endpoint}/api/deploy`;
    try {
      const {body} = await got.post(remoteUrl, options);
      // check for errors
      if (!body || !body.length) {
        throw new Error('Error deploying!');
      }
      console.log(chalk.green('Successfully deployed!'));
      body.forEach((container, i) => {
        console.log(chalk.bold(`${i + 1})`), 'Container with ID:', container.id);
      });
    } catch (e) {
      // try generic error handling first
      if (handleError(e)) {
        return;
      }

      // log other errors
      console.log(chalk.red('Error deploying!'));
      console.error(e);
    }
  });
