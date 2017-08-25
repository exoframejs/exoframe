// npm modules
const chalk = require('chalk');
const ignore = require('ignore');
const tar = require('tar-fs');
const got = require('got');
const path = require('path');
const fs = require('fs');
const ora = require('ora');
const Table = require('cli-table');
const open = require('open');

// my modules
const {userConfig, isLoggedIn, logout} = require('../config');
const {tableBorder, tableStyle} = require('../config/table');
const formatServices = require('../util/formatServices');

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
exports.builder = {
  token: {
    alias: 't',
    description: 'Deployment token to be used for authentication',
  },
  update: {
    alias: 'u',
    description: 'Update current project instead of simple deployment',
  },
  open: {
    alias: 'o',
    description: 'Open deployed project in browser after upload',
  },
};
exports.handler = async (args = {}) => {
  const deployToken = args.token;

  // exit if not logged in and no token provided
  if (!deployToken && !isLoggedIn()) {
    return;
  }

  const folder = args._ ? args._.filter(arg => arg !== 'deploy').shift() : undefined;
  const update = args.update;

  console.log(
    chalk.bold(`${update ? 'Updating' : 'Deploying'} ${folder || 'current project'} to endpoint:`),
    userConfig.endpoint
  );

  // create config vars
  const workdir = folder ? path.join(process.cwd(), folder) : process.cwd();
  const folderName = path.basename(workdir);
  const remoteUrl = `${userConfig.endpoint}/${update ? 'update' : 'deploy'}`;

  // make sure workdir exists
  if (!fs.existsSync(workdir)) {
    console.log(chalk.red(`Error! Path ${chalk.bold(workdir)} do not exists`));
    console.log('Please, check your arguments and try again.');
    return;
  }

  // create config if doesn't exist
  const configPath = path.join(workdir, 'exoframe.json');
  try {
    fs.statSync(configPath);
  } catch (e) {
    const defaultConfig = JSON.stringify({name: folderName});
    fs.writeFileSync(configPath, defaultConfig, 'utf-8');
  }

  // show loader
  const spinner = ora('Uploading project to server...').start();

  // syntax-check config
  try {
    JSON.parse(fs.readFileSync(configPath));
  } catch (e) {
    spinner.fail('Your exoframe.json is not valid');
    console.log(chalk.red('Please, check your config and try again:'), e.toString());
    return;
  }

  // create tar stream from current folder
  const ig = ignore().add(ignores);
  const tarStream = tar.pack(workdir, {
    ignore: name => ig.ignores(name),
  });

  let token = userConfig.token;
  if (deployToken) {
    token = deployToken;
    console.log('Deploying using given token..');
  }
  const options = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // pipe stream to remote
  try {
    const res = await streamToResponse({tarStream, remoteUrl, options});
    if (!res.deployments || !res.deployments.length) {
      throw new Error('Something went wrong!');
    }
    spinner.succeed('Upload finsihed!');
    console.log('Your project is now deployed as:\n');
    // create table
    const resultTable = new Table({
      head: ['ID', 'URL', 'Hostname'],
      chars: tableBorder,
      style: tableStyle,
    });

    // process deployments
    const formattedServices = formatServices(res.deployments);
    formattedServices.forEach(({name, domain, host}) => {
      resultTable.push([name, domain, host]);
    });

    // draw table
    console.log(resultTable.toString());

    // open in browser
    if (args.open && formattedServices[0].domain && formattedServices[0].domain !== 'not set') {
      open(`http://${formattedServices[0].domain.split(',')[0].trim()}`);
    }
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
