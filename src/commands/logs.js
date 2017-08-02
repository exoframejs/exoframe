// npm packages
const got = require('got');
const chalk = require('chalk');

// our packages
const {userConfig, isLoggedIn, logout} = require('../config');

exports.command = ['logs <id>', 'log <id>'];
exports.describe = 'get logs for given deployment';
exports.builder = {};
exports.handler = ({id}) =>
  new Promise(resolve => {
    if (!isLoggedIn()) {
      return;
    }

    console.log(chalk.bold('Getting logs for deployment:'), id, '\n');

    // services request url
    const remoteUrl = `${userConfig.endpoint}/logs/${id}`;
    // construct shared request params
    const options = {
      headers: {
        Authorization: `Bearer ${userConfig.token}`,
      },
    };
    // try sending request
    const logStream = got.stream(remoteUrl, options);
    logStream.on('error', e => {
      // if authorization is expired/broken/etc
      if (e.statusCode === 401) {
        logout(userConfig);
        console.log(chalk.red('Error: authorization expired!'), 'Please, relogin and try again.');
        return;
      }

      // if container was not found
      if (e.statusCode === 404) {
        console.log(chalk.red('Error: container was not found!'), 'Please, check deployment ID and try again.');
        return;
      }

      console.log(chalk.red('Error while getting logs:'), e.toString());
    });
    logStream.on('data', buf => {
      const d = buf.toString();
      const lines = d.split('\n');
      lines
        .map(line => line.replace(/^\u0001.+?(\d)/g, '$1').replace(/\n+$/, ''))
        .filter(line => line && line.length > 0)
        .map(line => {
          if (line.startsWith('Logs for')) {
            return {date: null, msg: `${chalk.bold(line)}\n`};
          }

          const parts = line.split(/\dZ\s/);
          const date = new Date(parts[0]);
          const msg = parts[1];
          return {date, msg};
        })
        .filter(({date, msg}) => date !== undefined && msg !== undefined)
        .map(({date, msg}) => ({
          date: date && isFinite(date) ? `${date.toLocaleDateString()} ${date.toLocaleTimeString()}` : '  ',
          msg,
        }))
        .map(({date, msg}) => `${chalk.gray(`${date}`)} ${msg}`)
        .forEach(line => console.log(line));

      resolve();
    });
  });
