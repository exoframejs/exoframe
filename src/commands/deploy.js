// npm modules
const chalk = require('chalk');
const ignore = require('ignore');
const tar = require('tar-fs');
const got = require('got');
const path = require('path');
const fs = require('fs');
const ora = require('ora');
const Table = require('cli-table');
const opn = require('opn');
const _ = require('highland');

// my modules
const {userConfig, isLoggedIn, logout} = require('../config');
const {tableBorder, tableStyle} = require('../config/table');
const formatServices = require('../util/formatServices');

const ignores = ['.git', 'node_modules'];

const streamToResponse = ({tarStream, remoteUrl, options, verbose}) =>
  new Promise((resolve, reject) => {
    // store error and result
    let error;
    let result = {};
    // pipe stream to remote
    const stream = _(tarStream.pipe(got.stream.post(remoteUrl, options)))
      .split()
      .filter(l => l && l.length);
    // store output
    stream.on('data', str => {
      const s = str.toString();
      try {
        const data = JSON.parse(s);
        // always log info
        if (data.level === 'info') {
          verbose && console.log(chalk.blue('[info]'), data.message);
          // if data has deployments info - assign it as result
          if (data.deployments) {
            result = data;
          }
        }
        // log verbose if needed
        data.level === 'verbose' && verbose > 1 && console.log(chalk.grey('[verbose]'), data.message);
        // if error - store as error and log
        if (data.level === 'error') {
          verbose && console.log(chalk.red('[error]'), data.message);
          verbose > 1 && console.log(JSON.stringify(data, null, 2));
          error = new Error(data.message);
          error.response = data;
        }
      } catch (e) {
        error = new Error('Error parsing output!');
        error.response = {
          error: s,
        };
        verbose && console.log(chalk.red('[error]'), 'Error parsing line:', s);
      }
    });
    // listen for read stream end
    stream.on('end', () => {
      // if stream had error - reject
      if (error) {
        reject(error);
        return;
      }
      // otherwise resolve
      resolve(result);
    });
    stream.on('error', e => (error = e));
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
  verbose: {
    alias: 'v',
    description: 'Verbose mode; will output more information',
    count: true,
  },
};
exports.handler = async (args = {}) => {
  const deployToken = args.token;
  const {verbose} = args;

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
    // if in verbose mode - log config creation
    verbose && console.log('Create new default config:', defaultConfig);
  }

  // show loader
  let spinner;
  if (!verbose) {
    spinner = ora('Deploying project to server...').start();
  }

  // syntax-check config
  try {
    JSON.parse(fs.readFileSync(configPath));
  } catch (e) {
    spinner && spinner.fail('Your exoframe.json is not valid');
    console.log(chalk.red('Please, check your config and try again:'), e.toString());
    return;
  }

  // create tar stream from current folder
  const ig = ignore().add(ignores);
  const tarStream = tar.pack(workdir, {
    ignore: name => ig.ignores(name),
  });
  // if in verbose mode - log ignores
  verbose && console.log('\nIgnoring following paths:', ignores);

  let token = userConfig.token;
  if (deployToken) {
    token = deployToken;
    console.log('\nDeploying using given token..');
  }
  const options = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // pipe stream to remote
  try {
    const res = await streamToResponse({tarStream, remoteUrl, options, verbose});
    // check deployments
    if (!res.deployments || !res.deployments.length) {
      const err = new Error('Something went wrong!');
      err.response = res;
      throw err;
    }
    spinner && spinner.succeed('Upload finsihed!');

    // log response in verbose-verbose mode
    verbose > 2 && console.log(chalk.gray('Server response:'), JSON.stringify(res, null, 2), '\n');

    // log result
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
      opn(`http://${formattedServices[0].domain.split(',')[0].trim()}`);
    }
  } catch (e) {
    spinner && spinner.fail('Deployment failed!');
    // if authorization is expired/broken/etc
    if (e.statusCode === 401) {
      logout(userConfig);
      console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
      return;
    }

    const response = e.response || {};
    const reason = response.error || e.toString();
    console.log(chalk.red('Error deploying project:'), reason || 'Unknown reason');
    console.log('Build log:\n');
    (response.log || ['No log available'])
      .filter(l => l !== undefined)
      .map(l => l.trim())
      .filter(l => l && l.length > 0)
      .forEach(line => console.log(line));

    // if in verbose mode - log original error and response
    verbose && console.log('');
    verbose && console.log('Original error:', e);
    verbose > 1 && console.log('Original response:', e.response);
  }
};
