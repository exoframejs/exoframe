import got from 'got';
import { formatServices } from './utils/formatServices.js';

/**
 * Lists deployments from given exoframe server endpoint
 * @param {object} params
 * @param {string} params.endpoint - exoframe server endpoint
 * @param {string} params.token - exoframe auth token
 * @returns
 */
export const listDeployments = async ({ endpoint, token }) => {
  // services request url
  const remoteUrl = `${endpoint}/list`;

  // construct shared request params
  const options = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: 'json',
  };

  // try sending request
  let containers = [];
  let services = [];
  try {
    const { body } = await got(remoteUrl, options);
    if (!body) {
      throw new Error('Server returned empty response!');
    }

    ({ containers = [], services = [] } = body);
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.statusCode === 401) {
      throw new Error('Authorization expired!');
    }

    // otherwise - just rethrow
    throw e;
  }

  // pre-format container and services
  const formattedContainers = formatServices(containers);
  const formattedServices = formatServices(services);

  return { containers: formattedContainers, services: formattedServices };
};
