// npm packages
import fs from 'fs';
import got from 'got';
import tar from 'tar-fs';
import path from 'path';
import chalk from 'chalk';
import minimatch from 'minimatch';
import spinner from 'char-spinner';
import inquirer from 'inquirer';

// our packages
import config, {isLoggedIn} from './config';
import detectTemplate from './templates';
import {handleError} from './error';
import {labelsFromString} from './util';

// text cleanup
export const cleanText = (txt) => txt.trim().replace(/[\n\r]/g, '');

const command = 'build';
const describe = 'build current folder using exoframe server';
const builder = {
  tag: {
    alias: 't',
  },
  noninteractive: {
    alias: 'ni',
  },
  verbose: {
    alias: 'v',
  },
};
const handler = async ({tag, noninteractive, verbose}) => {
  if (!isLoggedIn()) {
    return;
  }

  console.log(chalk.bold('Building current folder using endpoint:'), config.endpoint);
  // create config vars
  const remoteUrl = `${config.endpoint}/api/build`;
  const workdir = process.cwd();

  // get templates based on workdir
  const template = detectTemplate(workdir);
  if (!template) {
    console.error(chalk.red('Error!'), 'Could not detect template for current project!');
    return;
  }

  let userTag = tag || workdir.split('/').pop().trim();
  let userLabels = {};
  if (!noninteractive) {
    // get user custom tag
    const {userInputTag} = await inquirer
    .prompt({
      type: 'input',
      name: 'userInputTag',
      message: 'Image tag:',
      default: userTag,
    });
    userTag = userInputTag;

    let moreLabels = false;
    const askForLabel = async () => {
      const {userInputLabels} = await inquirer.prompt({
        type: 'input',
        name: 'userInputLabels',
        message: moreLabels ? 'Custom label (blank to continue)' : 'Custom label:',
      });
      const l = labelsFromString(userInputLabels);
      if (l) {
        userLabels = {
          ...userLabels,
          ...l,
        };
        moreLabels = true;
        return askForLabel();
      }

      return undefined;
    };
    // ask for labels
    await askForLabel();
  }

  if (!noninteractive && template.interactive) {
    await template.interactive(inquirer);
  }

  // check template dockerfile
  if (!template.dockerfile || !template.dockerfile.length) {
    console.error(chalk.red('Error!'), 'Template Dockerfile is empty!');
    return;
  }

  // metadata
  const buildTag = userTag || tag;
  const dockerfilePath = path.join(workdir, 'Dockerfile');
  const labels = {
    ...template.labels,
    ...userLabels,
    'exoframe.user': config.user.username,
  };

  // check if dockerfile already exists
  let deleteDockerfile = false;
  try {
    fs.accessSync(dockerfilePath);
  } catch (e) {
    // if no - write new dockerfile
    fs.writeFileSync(dockerfilePath, template.dockerfile, 'utf8');
    // say we need to delete dockerfile later
    deleteDockerfile = true;
  }

  // create tar stream from current folder
  const tarStream = tar.pack(workdir, {ignore: (name) => template.ignores.some(ignore => minimatch(name, ignore))});

  const options = {
    headers: {
      'x-access-token': config.token,
    },
    query: {
      tag: buildTag,
      labels: JSON.stringify(labels),
    },
  };

  // render spinner
  let spinnerInterval;
  if (!verbose) {
    spinnerInterval = spinner();
  }
  const cleanUp = () => {
    if (deleteDockerfile) {
      try {
        fs.unlinkSync(dockerfilePath);
      } catch (e) {
        console.log('error deleting dockerfile:', e);
      }
    }
    // stop spinner
    if (!verbose) {
      clearInterval(spinnerInterval);
    }
  };
  // pipe stream to remote
  const stream = tarStream.pipe(got.stream.post(remoteUrl, options));
  // log output if in verbose mode
  stream.on('data', (str) => {
    if (verbose) {
      const text = str.toString().split('\n');
      text.filter(t => t && t.length).forEach(t => {
        try {
          const data = JSON.parse(t);
          console.log(cleanText(data.stream));
        } catch (e) {
          console.log(cleanText(t));
        }
      });
    }
  });
  // listen for read stream end
  stream.on('end', () => {
    cleanUp();
    // log end
    console.log(chalk.bold('Done building!'), `Your images is now available as ${buildTag}`);
  });
  // listen for stream errors
  stream.on('error', (e) => {
    // do delayed cleanup
    setTimeout(cleanUp, 100);
    // try generic error handling first
    if (handleError(e)) {
      return;
    }
    // log other errors
    console.log(chalk.bold('Error during build!'));
    console.error(e);
  });
};

export default {
  command,
  describe,
  builder,
  handler,
};
