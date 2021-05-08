import got from 'got';

/**
 * @typedef {object} Secret
 * @property {string} name - secret name
 * @property {string} [value] - secret value
 * @property {object} [metadata] - secret metadata
 * @property {string} metadata.created - secret creation date string
 */

/**
 * List secrets for given exoframe endpoint
 * @param {object} params
 * @param {string} params.endpoint - exoframe server endpoint
 * @param {string} params.token - exoframe auth token
 * @returns {Secret[]}
 */
export const listSecrets = async ({ endpoint, token }) => {
  const remoteUrl = `${endpoint}/secrets`;

  // construct shared request params
  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: 'json',
  };

  // try sending request
  try {
    const {
      body: { secrets },
    } = await got(remoteUrl, options);
    return secrets;
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.response.statusCode === 401) {
      throw new Error('Authorization expired!');
    }

    throw e;
  }
};

/**
 * Create new secrets on given exoframe endpoint
 * @param {object} params
 * @param {string} params.name - new secret name
 * @param {string} params.value - new secret value
 * @param {string} params.endpoint - exoframe server endpoint
 * @param {string} params.token - exoframe auth token
 * @returns {Secret}
 */
export const createSecret = async ({ name, value, endpoint, token }) => {
  const remoteUrl = `${endpoint}/secrets`;

  // construct shared request params
  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: 'json',
    json: {
      secretName: name,
      secretValue: value,
    },
  };
  // try sending request
  try {
    const { body } = await got(remoteUrl, options);
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
 * Get existing secret value for given exoframe endpoint
 * @param {object} params
 * @param {string} params.name - existing secret name
 * @param {string} params.endpoint - exoframe server endpoint
 * @param {string} params.token - exoframe auth token
 * @returns {Secret}
 */
export const getSecret = async ({ name, endpoint, token }) => {
  const remoteUrl = `${endpoint}/secrets`;

  // construct shared request params
  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: 'json',
  };

  // try sending request
  try {
    const {
      body: { secret },
    } = await got(`${remoteUrl}/${name}`, options);
    return secret;
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.response.statusCode === 401) {
      throw new Error('Authorization expired!');
    }

    throw e;
  }
};

/**
 * Remove existing secret from given exoframe endpoint
 * @param {object} params
 * @param {string} params.name - existing secret name
 * @param {string} params.endpoint - exoframe server endpoint
 * @param {string} params.token - exoframe auth token
 * @returns {boolean}
 */
export const removeSecret = async ({ name, endpoint, token }) => {
  const remoteUrl = `${endpoint}/secrets`;

  // construct shared request params
  const rmOptions = {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: 'json',
    json: {
      secretName: name,
    },
  };
  try {
    const { body, statusCode } = await got(remoteUrl, rmOptions);
    if (statusCode !== 204) {
      throw new Error(`Error removing deployment secret: ${body.reason || 'Please try again!'}`);
    }

    return true;
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.response.statusCode === 401) {
      throw new Error('Authorization expired!');
    }

    throw e;
  }
};
