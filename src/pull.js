// npm packages
import chalk from 'chalk';
import got from 'got';
import spinner from 'char-spinner';

// our packages
import config, {isLoggedIn} from './config';
import {handleError} from './error';
import {cleanText} from './build';

const command = 'pull <image>';
const describe = 'pull image from registry on exoframe server';
const builder = {
  image: {
    alias: 'i',
  },
  verbose: {
    alias: 'v',
    global: true,
  },
};
const handler = async ({image, verbose}) => {
  if (!isLoggedIn()) {
    return;
  }

  // log header
  console.log(chalk.bold('Pulling image on:'), config.endpoint);
  console.log();

  // send request to remove
  const pullUrl = `${config.endpoint}/api/pull`;
  // construct shared request params
  const options = {
    headers: {
      'x-access-token': config.token,
    },
    query: {image},
  };
  // render spinner
  let spinnerInterval;
  if (!verbose) {
    spinnerInterval = spinner();
  }
  const cleanUp = () => {
    // stop spinner
    if (!verbose) {
      clearInterval(spinnerInterval);
    }
  };
  // try sending request
  const stream = got.stream(pullUrl, options);
  // log output if in verbose mode
  stream.on('data', (str) => {
    if (verbose) {
      const text = str.toString().split('\n');
      text.filter(t => t && t.length).map(t => cleanText(t)).forEach(t => {
        try {
          const s = JSON.parse(t);
          console.log(`${s.id ? `[${s.id}]: ` : ''}${s.status} ${s.progress ? s.progress : ''}`);
        } catch (e) {
          console.log(t);
        }
      });
    }
  });
  // listen for read stream end
  stream.on('end', () => {
    cleanUp();
    // log end
    console.log(chalk.bold('Done pulling!'), `Your image is now available as ${image}`);
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
    console.log(chalk.bold('Error during pull!'));
    console.error(e);
  });
};

export default {
  command,
  describe,
  builder,
  handler,
};
