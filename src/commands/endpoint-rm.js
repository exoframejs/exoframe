// npm packages
const chalk = require('chalk');
const inquirer = require('inquirer');

// our packages
const {userConfig, updateConfig} = require('../config');

exports.command = 'rm-endpoint [url]';
exports.describe = 'remove existing exoframe endpoint';
exports.builder = {
  url: {
    alias: 'u',
    default: '',
    description: 'URL of an existing endpoint',
  },
};
exports.handler = async ({url}) => {
  let endpointUrl = url;

  // if one endpoint only - show error
  if (!userConfig.endpoints || !userConfig.endpoints.length) {
    console.log(chalk.red('Error!'), chalk.bold('Cannot remove the only endpoint URL:'), userConfig.endpoint);
    return;
  }

  // if not endpoint url given - show selector
  if (!endpointUrl || !endpointUrl.length) {
    // if multiple - show selector
    const prompts = [];
    prompts.push({
      type: 'list',
      name: 'delEndpoint',
      message: 'Choose endpoint to remove:',
      default: userConfig.endpoint,
      choices: [userConfig.endpoint].concat(userConfig.endpoints.map(entry => entry.endpoint)),
    });
    const {delEndpoint} = await inquirer.prompt(prompts);
    // assign new selected as entered endpoint
    endpointUrl = delEndpoint;
  }

  // if current endpoint set - move it to endpoints
  if (userConfig.endpoint === endpointUrl) {
    console.log(chalk.bold('Removing endpoint:'), endpointUrl);
    const newData = userConfig.endpoints.shift();
    const endpoint = newData.endpoint;
    const user = newData ? newData.user : null;
    const token = newData ? newData.token : null;
    const endpoints = userConfig.endpoints.filter(e => e.endpoint !== newData.endpoint);
    updateConfig({endpoint, user, token, endpoints});
    console.log(chalk.green('Endpoint removed!'));
    return;
  }

  const index = userConfig.endpoints.findIndex(it => it.endpoint === endpointUrl);
  if (index === -1) {
    console.log(chalk.red('Error!'), "Couldn't find endpoint with URL:", endpointUrl);
    return;
  }

  // then write new endpoint to current one and remove user/token
  console.log(chalk.bold('Removing endpoint:'), endpointUrl);
  const endpoints = userConfig.endpoints.filter(e => e.endpoint !== endpointUrl);
  updateConfig({endpoints});
  console.log(chalk.green('Endpoint removed!'));
};
