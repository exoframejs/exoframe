// npm modules
const chalk = require('chalk');
const ignore = require('ignore');
const tar = require('tar-fs');
const got = require('got');
const path = require('path');
const fs = require('fs');
const ora = require('ora');
const Table = require('cli-table');

// my modules
const {userConfig, isLoggedIn, logout} = require('../config');
const {tableBorder, tableStyle} = require('../config/table');

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

  // show loader
  const spinner = ora('Uploading project to server...').start();

  // syntax-check config
  try {
    JSON.parse(fs.readFileSync(configPath));
  } catch (e) {
    spinner.fail('Your exoframe.json is not valid');
    return;
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
    res.deployments.forEach(deployment => {
      const name = deployment.Name.slice(1);
      const domain = deployment.Config.Labels['traefik.frontend.rule']
        ? `http://${deployment.Config.Labels['traefik.frontend.rule'].replace('Host:', '')}`
        : 'Not set';
      const aliases = deployment.NetworkSettings.Networks.exoframe.Aliases
        ? deployment.NetworkSettings.Networks.exoframe.Aliases.filter(alias => !deployment.Id.startsWith(alias))
        : [];
      const host = aliases.shift() || 'Not set';
      resultTable.push([name, domain, host]);
    });

    // draw table
    console.log(resultTable.toString());
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
