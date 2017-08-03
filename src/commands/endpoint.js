// npm packages
const chalk = require('chalk');
const inquirer = require('inquirer');

// our packages
const {userConfig, updateConfig} = require('../config');

exports.command = 'endpoint [url]';
exports.describe = 'switch or add exoframe server URL';
exports.builder = {
  url: {
    alias: 'u',
    default: '',
    description: 'URL of a new endpoint',
  },
};
exports.handler = async ({url}) => {
  let endpoint = url;
  if (!endpoint || !endpoint.length) {
    // if one endpoint only - show this
    if (!userConfig.endpoints || !userConfig.endpoints.length) {
      console.log(chalk.bold('Current endpoint URL:'), userConfig.endpoint);
      return;
    }

    // if multiple - show selector
    const prompts = [];
    prompts.push({
      type: 'list',
      name: 'newEndpoint',
      message: 'Choose endpoint:',
      default: userConfig.endpoint,
      choices: [userConfig.endpoint].concat(userConfig.endpoints.map(entry => entry.endpoint)),
    });
    const {newEndpoint} = await inquirer.prompt(prompts);
    // if user selected current - just exit
    if (newEndpoint === userConfig.endpoint) {
      return;
    }
    // assign new selected as entered endpoint
    endpoint = newEndpoint;
  }

  // if current endpoint set - move it to endpoints
  if (userConfig.endpoint) {
    // init array if needed
    if (!userConfig.endpoints) {
      userConfig.endpoints = [];
    }
    // push data
    userConfig.endpoints.push({
      endpoint: userConfig.endpoint,
      user: userConfig.user,
      token: userConfig.token,
    });
  }
  // then write new endpoint to current one and remove user/token
  console.log(chalk.bold('Updating endpoint URL to:'), endpoint);
  const newData = userConfig.endpoints.find(e => e.endpoint === endpoint);
  const user = newData ? newData.user : null;
  const token = newData ? newData.token : null;
  const endpoints = userConfig.endpoints.filter(e => e.endpoint !== endpoint);
  updateConfig({endpoint, user, token, endpoints});
  console.log(chalk.green('Endpoint URL updated!'));
};
