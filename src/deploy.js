// npm packages
import chalk from 'chalk';
import got from 'got';
import inquirer from 'inquirer';

// our packages
import config, {isLoggedIn} from './config';
import {handleError} from './error';
import {getImages, getServices} from './list';
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

const command = 'deploy [image]';
const describe = 'deploy image on exoframe server';
const builder = {
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
  links: {
    alias: 'li',
  },
  noninteractive: {
    alias: 'ni',
  },
};
const handler = async ({
  image: userImage,
  ports: textPorts,
  labels: textLabels,
  env: textEnv,
  restart: textRestart,
  volumes: textVolumes,
  links: textLinks,
  noninteractive,
}) => {
  if (!isLoggedIn()) {
    return;
  }

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
  let links = (Array.isArray(textLinks) ? textLinks : [textLinks]).filter(e => e !== undefined);
  let restart = {name: textRestart};

  // ask user about config if we're interactive
  if (!noninteractive) {
    const services = await getServices();
    const liveServices = services
      .map(s => ({...s, name: s.Names[0].replace(/^\//, '')}))
      .filter(s => s.Status.toLowerCase().includes('up'));

    // ask what features user wants to use
    const featureChoices = [{
      id: 'restart',
      name: 'Set restart policy',
      checked: true,
    }, {
      id: 'ports',
      name: 'Forward ports',
    }, {
      id: 'labels',
      name: 'Add custom labels',
    }, {
      id: 'env',
      name: 'Add environment variables',
    }, {
      id: 'volumes',
      name: 'Add volumes',
    }];
    if (liveServices.length > 0) {
      featureChoices.push({
        id: 'links',
        name: 'Link with other services',
      });
    }
    const {features} = await inquirer.prompt({
      type: 'checkbox',
      name: 'features',
      message: 'What do you want to do for this deployment?',
      choices: featureChoices,
    });
    const featuresList = features.map(name => featureChoices.find(f => f.name === name).id);

    // ask for ports
    if (featuresList.includes('ports')) {
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
    }

    // ask for links
    if (featuresList.includes('links')) {
      const {inLinks} = await inquirer.prompt({
        type: 'checkbox',
        name: 'inLinks',
        message: 'Select containers to link:',
        choices: liveServices,
      });
      // assign ports
      if (inLinks) {
        links = [...links, ...inLinks];
      }
      // check if there are any links
      if (links.length) {
        const prompts = [{
          type: 'confirm',
          name: 'renameLinks',
          message: 'Change link names?',
          default: false,
        }, ...links.map(l => ({
          type: 'input',
          name: l,
          message: 'Link name:',
          default: l,
          filter: (val) => (val ? `${l}:${val}` : l),
          when: ({renameLinks}) => renameLinks,
        }))];
        const answers = await inquirer.prompt(prompts);
        const renamedLinks = Object.keys(answers).filter(k => k !== 'renameLinks').map(k => answers[k]);
        // assign ports
        links = renamedLinks;
      }
    }

    if (featuresList.includes('labels')) {
      // ask for labels
      let moreLabels = false;
      let userLabels = [];
      const askForLabels = async () => {
        const {inLabels} = await inquirer.prompt({
          type: 'input',
          name: 'inLabels',
          message: moreLabels ? 'Custom label (blank to continue):' : 'Custom label [key=value]:',
        });
        // assign ports
        const l = labelArrayFromString(inLabels);
        if (l) {
          userLabels = [...userLabels, ...l];
          moreLabels = true;
          return askForLabels();
        }

        return undefined;
      };
      await askForLabels();
      // assign labels
      labels = userLabels ? processLabels(userLabels) : labels;
    }

    if (featuresList.includes('env')) {
      // ask for env vars
      let moreEnv = false;
      const askForEnv = async () => {
        const {inEnv} = await inquirer.prompt({
          type: 'input',
          name: 'inEnv',
          message: moreEnv ? 'Environment variable (blank to continue):' : 'Environment variable [key=value]:',
        });
        // assign ports
        const l = commaStringToArray(inEnv);
        if (l) {
          env = [...env, ...l];
          moreEnv = true;
          return askForEnv();
        }

        return undefined;
      };
      await askForEnv();
    }

    if (featuresList.includes('volumes')) {
      // ask for volumes
      let moreVol = false;
      const askForVol = async () => {
        const {inVolumes} = await inquirer.prompt({
          type: 'input',
          name: 'inVolumes',
          message: moreVol ? 'Volumes (blank to continue):' : 'Volumes:',
        });
        // assign ports
        const l = commaStringToArray(inVolumes);
        if (l) {
          volumes = [...volumes, ...l];
          moreVol = true;
          return askForVol();
        }

        return undefined;
      };
      await askForVol();
    }

    if (featuresList.includes('restart')) {
      // ask for restart policy and retries count when applicable
      const {inRestart, inRestartRetries} = await inquirer
      .prompt([{
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
      // assign restart
      restart = inRestart ? {
        name: inRestart,
        retries: inRestartRetries,
      } : textRestart;
    }
  }

  // send request
  const options = {
    headers: {
      'x-access-token': config.token,
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      services: [{name: image, ports, labels, env, restart, volumes, links}],
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
      console.log(chalk.bold(`${i + 1})`), 'Container with ID:', container.id.slice(0, 12));
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
};

export default {
  command,
  describe,
  builder,
  handler,
};
