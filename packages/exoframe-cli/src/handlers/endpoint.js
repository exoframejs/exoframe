import chalk from 'chalk';
import inquirer from 'inquirer';
import { getConfig, updateConfig } from '../config/index.js';

/**
 * Change endpoint in config to given one
 * @param {String} endpoint - new endpoint URL
 */
export const changeEndpoint = async (endpoint) => {
  const userConfig = getConfig();

  // if current endpoint set - move it to endpoints
  if (userConfig.endpoint) {
    // init array if needed
    if (!userConfig.endpoints) {
      userConfig.endpoints = [];
    }
    // push data
    userConfig.endpoints.push({
      endpoint: userConfig.endpoint,
      user: userConfig.user || undefined,
      token: userConfig.token || undefined,
    });
  }
  // then write new endpoint to current one and remove user/token
  console.log(chalk.bold('Updating endpoint URL to:'), endpoint);
  const newData = userConfig.endpoints.find((e) => e.endpoint === endpoint);
  const user = newData?.user;
  const token = newData?.token;
  const endpoints = userConfig.endpoints.filter((e) => e.endpoint !== endpoint);
  updateConfig({ endpoint, user, token, endpoints });
  console.log(chalk.green('Endpoint URL updated!'));
};

/**
 * Endpoint switch handler.
 * Shows list of endpoints and asks user to choose new one
 */
export const endpointSwitchHandler = async (url) => {
  const userConfig = getConfig();

  // if one endpoint only - show this
  if (!userConfig.endpoints?.length) {
    console.log(chalk.yellow('Only one endpoint available!'));
    console.log(chalk.bold('Current endpoint URL: '), userConfig.endpoint);
    return;
  }

  // if endpoint passed via param - use it
  let endpoint = url;

  // if url wasn't passed - ask user to select new endpoint
  if (!url?.length) {
    // if multiple - show selector
    const prompts = [];
    prompts.push({
      type: 'list',
      name: 'newEndpoint',
      message: 'Choose endpoint:',
      default: userConfig.endpoint,
      choices: [userConfig.endpoint].concat(userConfig.endpoints.map((entry) => entry.endpoint)),
    });
    const { newEndpoint } = await inquirer.prompt(prompts);
    // if user selected current - just exit
    if (newEndpoint === userConfig.endpoint) {
      console.log(chalk.yellow('Already selected. Not changing endpoint.'));
      return;
    }
    // assign new selected as entered endpoint
    endpoint = newEndpoint;
  }

  // trigger change in config
  changeEndpoint(endpoint);
};

/**
 * Endpoint add handler.
 * Adds new endpoint to config.
 * @param {String} url - new endpoint URL
 */
export const endpointAddHandler = async (url) => {
  if (!url || !url.length) {
    console.log(chalk.red('Please provide endpoint URL!'));
    return;
  }

  const userConfig = getConfig();

  // if user selected current - just exit
  if (url === userConfig.endpoint) {
    console.log('Endpoint already set!');
    return;
  }

  // trigger change in config
  changeEndpoint(url);
};

/**
 * Endpoint remove handler.
 * Removes given endpoint from config, or shows list of endpoints and asks user to choose one to remove.
 * @param {String} [url] - endpoint URL to remove
 */
export const endpointRmHandler = async (url) => {
  const userConfig = getConfig();

  // assign given string as base endpoint
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
      choices: [userConfig.endpoint].concat(userConfig.endpoints.map((entry) => entry.endpoint)),
    });
    const { delEndpoint } = await inquirer.prompt(prompts);
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
    const endpoints = userConfig.endpoints.filter((e) => e.endpoint !== newData.endpoint);
    updateConfig({ endpoint, user, token, endpoints });
    console.log(chalk.green('Endpoint removed!'));
    return;
  }

  const index = userConfig.endpoints.findIndex((it) => it.endpoint === endpointUrl);
  if (index === -1) {
    console.log(chalk.red('Error!'), "Couldn't find endpoint with URL:", endpointUrl);
    return;
  }

  // then write new endpoint to current one and remove user/token
  console.log(chalk.bold('Removing endpoint:'), endpointUrl);
  const endpoints = userConfig.endpoints.filter((e) => e.endpoint !== endpointUrl);
  updateConfig({ endpoints });
  console.log(chalk.green('Endpoint removed!'));
};
