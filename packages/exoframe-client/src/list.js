import got from 'got';
import { formatServices } from './utils/formatServices.js';

/**
 * Lists deployments from given exoframe server endpoint
 * @param {object} params
 * @param {string} params.endpoint - exoframe server endpoint
 * @param {string} params.token - exoframe auth token
 * @returns {Promise<import('./utils/formatServices.js').FormattedService[]>}
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
  try {
    const { body } = await got(remoteUrl, options);
    if (!body) {
      throw new Error('Server returned empty response!');
    }

    ({ containers = [] } = body);
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.response?.statusCode === 401) {
      throw new Error('Authorization expired!');
    }

    // otherwise - just rethrow
    throw e;
  }

  // pre-format container and services
  const formattedContainers = formatServices(containers);
  return formattedContainers;
};
