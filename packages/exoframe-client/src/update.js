import got from 'got';

// valid targets list
const validTargets = ['traefik', 'server', 'all'];

/**
 * @typedef {object} UpdateResult
 * @property {string} server - current exoframe server version
 * @property {string} latestServer - latest exoframe server version
 * @property {boolean} serverUpdate - is server update available
 * @property {string} traefik - current traefik server version
 * @property {string} latestTraefik - latest traefik server version
 * @property {boolean} traefikUpdate - is traefik update available
 */

/**
 * Check for available updates
 * @param {object} params
 * @param {string} params.endpoint - exoframe endpoint
 * @param {string} params.token - exoframe auth token
 * @returns {UpdateResult}
 */
export const checkUpdates = async ({ endpoint, token }) => {
  try {
    // services request url
    const remoteUrl = `${endpoint}/version`;
    // construct shared request params
    const options = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'json',
    };
    // send request
    const { body, statusCode } = await got.get(remoteUrl, options);
    if (statusCode !== 200 || body.error) {
      throw new Error(body.error || 'Oops. Something went wrong! Try again please.');
    }

    return body;
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.response.statusCode === 401) {
      throw new Error('Authorization expired!');
    }

    throw e;
  }
};

/**
 *
 * @param {object} params
 * @param {string} [params.target=all] - update target
 * @param {string} params.endpoint - exoframe endpoint
 * @param {string} params.token - exoframe auth token
 * @returns
 */
export const executeUpdate = async ({ target = 'all', endpoint, token }) => {
  if (!validTargets.includes(target)) {
    throw new Error('Invalid target!');
  }

  // services request url
  const remoteUrl = `${endpoint}/update/${target}`;

  // construct shared request params
  const options = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: 'json',
    json: {},
  };

  // try sending request
  try {
    const { body, statusCode } = await got.post(remoteUrl, options);
    if (statusCode !== 200 || body.error) {
      throw new Error(body.error || 'Oops. Something went wrong! Try again please.');
    }

    return body;
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.response.statusCode === 401) {
      throw new Error('Authorization expired!');
    }

    throw e;
  }
};
