// npm packages
import chalk from 'chalk';
import got from 'got';

// our packages
import config from './config';

// convert to human readable file size
const humanFileSize = (bytes) => {
  const thresh = 1024;
  if (Math.abs(bytes) < thresh) {
    return `${bytes} B`;
  }
  const units = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let u = -1;
  do {
    bytes /= thresh; // eslint-disable-line
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return `${bytes.toFixed(1)} ${units[u]}`;
};

export default (yargs) =>
  yargs.command('list [endpoint]', 'list your images on exoframe server', {
    endpoint: {
      default: config.endpoint,
    },
  }, async ({endpoint}) => {
    console.log(chalk.bold('Getting images from:'), endpoint);
    const options = {
      headers: {
        'x-access-token': config.token,
      },
      json: true,
    };
    const remoteUrl = `${endpoint.replace(/\/$/, '')}/api/list`;
    try {
      const {body} = await got(remoteUrl, options);
      // check for errors
      if (!body || !body.length) {
        throw new Error('Error getting images!');
      }
      console.log(chalk.green('Owned images:'));
      body.forEach((image, i) => {
        console.log(chalk.bold(`${i + 1})`), image.RepoTags[0], '-', humanFileSize(image.Size));
      });
    } catch (e) {
      console.error(e);
      console.log(chalk.red('Error getting images in!'));
    }
  });
