// npm packages
import chalk from 'chalk';
import got from 'got';
import inquirer from 'inquirer';

// our packages
import config from './config';
import {handleError} from './error';
import {getImages} from './list';
import {labelArrayFromString, commaStringToArray} from './util';

const processLabels = (labels) => labels
  .filter(l => l !== undefined)
  .map(l => {
    const [k, v] = l.split('=');
    if (!k || !v) {
      return undefined;
    }
    return {key: k, value: v};
  }).filter(l => l !== undefined);

export default (yargs) =>
  yargs.command('deploy [image]', 'deploy image on exoframe server', {
    ports: {
      alias: 'p',
    },
    labels: {
      alias: 'l',
    },
    env: {
      alias: 'e',
    },
    restart: {
      alias: 'r',
    },
    volumes: {
      alias: 'v',
    },
    noninteractive: {
      alias: 'ni',
    },
  }, async ({
    image: userImage,
    ports: textPorts,
    labels: textLabels,
    env: textEnv,
    restart: textRestart,
    volumes: textVolumes,
    noninteractive,
  }) => {
    let image = userImage;
    if (!image) {
      const images = await getImages();
      const {inImage} = await inquirer.prompt({
        type: 'list',
        name: 'inImage',
        message: 'Chose image to deploy:',
        choices: images,
      });
      image = inImage;
    }

    console.log(chalk.bold('Deploying:'), image, 'on', config.endpoint);
    // convert ports and labels to needed formats
    let ports = (Array.isArray(textPorts) ? textPorts : [textPorts]).filter(l => l !== undefined);
    let labels = processLabels(Array.isArray(textLabels) ? textLabels : [textLabels]);
    let env = (Array.isArray(textEnv) ? textEnv : [textEnv]).filter(e => e !== undefined);
    let volumes = (Array.isArray(textVolumes) ? textVolumes : [textVolumes]).filter(e => e !== undefined);
    let restart = {name: textRestart};

    // ask user about config if we're interactive
    if (!noninteractive) {
      // ask for ports
      let morePorts = false;
      const askForPorts = async () => {
        const {inPorts} = await inquirer.prompt({
          type: 'input',
          name: 'inPorts',
          message: morePorts ? 'Port mapping (blank to continue)' : 'Port mapping [container:host]:',
        });
        // assign ports
        const l = commaStringToArray(inPorts);
        if (l) {
          ports = [...ports, ...l];
          morePorts = true;
          return askForPorts();
        }

        return undefined;
      };
      await askForPorts();

      // get user custom tag
      const {inLabels, inEnv, inRestart, inRestartRetries, inVolumes} = await inquirer
      .prompt([{
        type: 'input',
        name: 'inLabels',
        message: 'Custom labels (comma separated):',
      }, {
        type: 'input',
        name: 'inEnv',
        message: 'Environment variables (comma separated):',
      }, {
        type: 'input',
        name: 'inVolumes',
        message: 'Volumes (comma separated):',
      }, {
        type: 'list',
        name: 'inRestart',
        message: 'Restart policy:',
        choices: ['no', 'on-failure', 'always', 'unless-stopped'],
        default: 'no',
      }, {
        type: 'input',
        name: 'inRestartRetries',
        message: 'Max restart retries:',
        validate: (val) => Number.isInteger(val),
        filter: (val) => Number.parseInt(val, 10),
        when: ({inRestart: r}) => r === 'on-failure',
      }]);
      // assign labels
      const userLabels = labelArrayFromString(inLabels);
      labels = userLabels ? processLabels(userLabels) : labels;
      // assign env vars
      env = commaStringToArray(inEnv) || env;
      // assign restart
      restart = inRestart ? {
        name: inRestart,
        retries: inRestartRetries,
      } : textRestart;
      // assign volumes
      volumes = commaStringToArray(inVolumes) || volumes;
    }

    // send request
    const options = {
      headers: {
        'x-access-token': config.token,
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        services: [{name: image, ports, labels, env, restart, volumes}],
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
