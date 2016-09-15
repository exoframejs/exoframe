// npm packages
import chalk from 'chalk';
import got from 'got';
import inquirer from 'inquirer';

// our packages
import config, {isLoggedIn} from './config';
import {handleError} from './error';
import {getImages} from './list';

const command = 'rmi [image]';
const describe = 'remove image on exoframe server';
const builder = {
  image: {
    alias: 'i',
  },
};
const handler = async ({image}) => {
  if (!isLoggedIn()) {
    return;
  }

  // log header
  console.log(chalk.bold('Removing image on:'), config.endpoint);
  console.log();
  if (!image) {
    console.log('No image given, fetching list...');
  }

  try {
    // try sending request
    const images = await getImages();
    if (images.length > 0) {
      let imgToRemove;
      if (!image) {
        console.log(chalk.green('Owned images:'));
        // ask for restart policy and retries count when applicable
        const {imageId} = await inquirer.prompt({
          type: 'list',
          name: 'imageId',
          message: 'Image to remove:',
          choices: images,
        });
        imgToRemove = images.find(svc => svc.name === imageId);
      } else {
        imgToRemove = images.find(svc => svc.Id.slice(0, 12) === image);
      }
      // stop
      console.log(chalk.bold('Removing:'), imgToRemove.name);
      // send request to remove
      const removeUrl = `${config.endpoint}/api/image/remove/${imgToRemove.Id.slice(0, 12)}`;
      // construct shared request params
      const options = {
        headers: {
          'x-access-token': config.token,
        },
        json: true,
      };
      // try sending request
      const {statusCode} = await got.post(removeUrl, options);
      if (statusCode === 204) {
        console.log(chalk.green('Image removed!'));
      } else {
        console.log(chalk.red('Error!'), 'Could not remove the image.');
      }
    } else {
      console.log(chalk.green('No owned images found!'));
    }
  } catch (e) {
    // try handling removal errors
    if (e.response.body && e.response.body.error && e.response.body.error.includes('image is being used')) {
      console.error(
        chalk.red('Error removing image:'), e.response.body.error.replace('(HTTP code 409) conflict', '')
      );
      return;
    }

    // then try generic error handling
    if (handleError(e)) {
      return;
    }

    // finally output error message and log error as is
    console.log(chalk.red('Error getting images!'));
    console.error(e);
  }
};

export default {
  command,
  describe,
  builder,
  handler,
};
