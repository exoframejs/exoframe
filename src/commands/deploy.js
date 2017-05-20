// npm modules
const chalk = require('chalk');
const ignore = require('ignore');
const tar = require('tar-fs');
const got = require('got');
const path = require('path');
const fs = require('fs');
const ora = require('ora');

// my modules
const {userConfig, isLoggedIn, logout} = require('../config');

const ignores = ['.git', 'node_modules'];

const streamToResponse = ({tarStream, remoteUrl, options}) =>
  new Promise((resolve, reject) => {
    // pipe stream to remote
    let result = '';
    const stream = tarStream.pipe(got.stream.post(remoteUrl, options));
    // log output if in verbose mode
    stream.on('data', str => (result += str.toString()));
    // listen for read stream end
    stream.on('end', () => {
      const res = JSON.parse(result);
      // ignore errored out results
      if (res.status !== 'success') {
        return;
      }
      // resolve on end
      resolve(res);
    });
    // listen for stream errors
    stream.on('error', e => reject(e));
  });

exports.command = ['*', 'deploy'];
exports.describe = 'deploy current folder';
exports.builder = {};
exports.handler = async args => {
  if (!isLoggedIn()) {
    return;
  }

  const folder = args && args._ ? args._.filter(arg => arg !== 'deploy').shift() : undefined;

  console.log(chalk.bold(`Deploying ${folder || 'current project'} to endpoint:`), userConfig.endpoint);

  // create config vars
  const workdir = folder ? path.join(process.cwd(), folder) : process.cwd();
  const folderName = path.basename(workdir);
  const remoteUrl = `${userConfig.endpoint}/deploy`;

  // create config if doesn't exist
  const configPath = path.join(workdir, 'exoframe.json');
  try {
    fs.statSync(configPath);
  } catch (e) {
    const defaultConfig = JSON.stringify({name: folderName});
    fs.writeFileSync(configPath, defaultConfig, 'utf-8');
  }

  // create tar stream from current folder
  const ig = ignore().add(ignores);
  const tarStream = tar.pack(workdir, {
    ignore: name => ig.ignores(name),
  });

  const options = {
    headers: {
      Authorization: `Bearer ${userConfig.token}`,
    },
  };

  // show loader
  const spinner = ora('Uploading project to server...').start();

  // pipe stream to remote
  try {
    const res = await streamToResponse({tarStream, remoteUrl, options});
    spinner.succeed('Upload finsihed!');
    console.log(`Your project is now deployed as:\n  > ${res.names.join('\n  > ')}`);
  } catch (e) {
    spinner.fail('Upload failed!');
    // if authorization is expired/broken/etc
    if (e.statusCode === 401) {
      logout(userConfig);
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    console.log(chalk.red('Error deploying project:'), e.toString());
  }
};
