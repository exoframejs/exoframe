import chalk from 'chalk';
import inquirer from 'inquirer';
import { getConfig, updateConfig } from '../config/index.ts';
import type { CliPromptQuestion } from '../types.ts';

/**
 * Change endpoint in config to given one
 *
 * @param endpoint - New endpoint URL to make current.
 */
export const changeEndpoint = async (endpoint: string) => {
  const userConfig = await getConfig();

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
  const savedEndpoints = userConfig.endpoints ?? [];
  const newData = savedEndpoints.find((e) => e.endpoint === endpoint);
  const user = newData?.user;
  const token = newData?.token;
  const endpoints = savedEndpoints.filter((e) => e.endpoint !== endpoint);
  await updateConfig({ endpoint, user, token, endpoints });
  console.log(chalk.green('Endpoint URL updated!'));
};

/**
 * Endpoint switch handler.
 * Shows list of endpoints and asks user to choose new one
 *
 * @param url - Endpoint URL to switch to. Prompts when omitted.
 */
export const endpointSwitchHandler = async (url) => {
  const userConfig = await getConfig();

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
    const prompts: CliPromptQuestion[] = [
      {
        type: 'select',
        name: 'newEndpoint',
        message: 'Choose endpoint:',
        default: userConfig.endpoint,
        choices: [userConfig.endpoint].concat(userConfig.endpoints.map((entry) => entry.endpoint)),
      },
    ];
    const { newEndpoint } = await inquirer.prompt<{ newEndpoint: string }>(prompts);
    // if user selected current - just exit
    if (newEndpoint === userConfig.endpoint) {
      console.log(chalk.yellow('Already selected. Not changing endpoint.'));
      return;
    }
    // assign new selected as entered endpoint
    endpoint = newEndpoint;
  }

  // trigger change in config
  await changeEndpoint(endpoint);
};

/**
 * Adds a new endpoint to the saved CLI config.
 *
 * @param url - Endpoint URL to add and switch to.
 */
export const endpointAddHandler = async (url?: string) => {
  if (!url || !url.length) {
    console.log(chalk.red('Please provide endpoint URL!'));
    return;
  }

  const userConfig = await getConfig();

  // if user selected current - just exit
  if (url === userConfig.endpoint) {
    console.log('Endpoint already set!');
    return;
  }

  // trigger change in config
  await changeEndpoint(url);
};

/**
 * Removes an endpoint from the saved CLI config, prompting when none is provided.
 *
 * @param url - Endpoint URL to remove.
 */
export const endpointRmHandler = async (url?: string) => {
  const userConfig = await getConfig();

  // assign given string as base endpoint
  let endpointUrl = url;

  // if one endpoint only - show error
  if (!userConfig.endpoints || !userConfig.endpoints.length) {
    console.log(chalk.red('Error!'), chalk.bold('Cannot remove the only endpoint URL:'), userConfig.endpoint);
    return;
  }

  // if not endpoint url given - show selector
  if (!endpointUrl || !endpointUrl.length) {
    const prompts: CliPromptQuestion[] = [
      {
        type: 'select',
        name: 'delEndpoint',
        message: 'Choose endpoint to remove:',
        default: userConfig.endpoint,
        choices: [userConfig.endpoint].concat(userConfig.endpoints.map((entry) => entry.endpoint)),
      },
    ];
    const { delEndpoint } = await inquirer.prompt<{ delEndpoint: string }>(prompts);
    // assign new selected as entered endpoint
    endpointUrl = delEndpoint;
  }

  // if current endpoint set - move it to endpoints
  if (userConfig.endpoint === endpointUrl) {
    console.log(chalk.bold('Removing endpoint:'), endpointUrl);
    const newData = userConfig.endpoints.shift();
    if (!newData) {
      console.log(chalk.red('Error!'), "Couldn't find endpoint with URL:", endpointUrl);
      return;
    }
    const endpoint = newData.endpoint;
    const user = newData.user;
    const token = newData.token;
    const endpoints = userConfig.endpoints.filter((e) => e.endpoint !== newData.endpoint);
    await updateConfig({ endpoint, user, token, endpoints });
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
  await updateConfig({ endpoints });
  console.log(chalk.green('Endpoint removed!'));
};
