// npm packages
import got from 'got';

/**
 * Lists installed templates for given exoframe endpoint
 * @param {object} params
 * @param {string} params.endpoint - exoframe server endpoint
 * @param {string} params.token - exoframe auth token
 * @returns {Object.<string, string>} - map of template names to versions (e.g. `{"templateName": "v1.0"}`)
 */
export const listTemplates = async ({ endpoint, token }) => {
  // services request url
  const remoteUrl = `${endpoint}/templates`;
  // construct shared request params
  const baseOptions = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: 'json',
  };

  // try sending request
  try {
    const { body: templates } = await got(remoteUrl, baseOptions);
    return templates;
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.response.statusCode === 401) {
      throw new Error('Authorization expired!');
    }

    throw e;
  }
};

/**
 * Removes specified template for given exoframe endpoint
 * @param {object} params
 * @param {string} params.template - template to remove
 * @param {string} params.endpoint - exoframe server endpoint
 * @param {string} params.token - exoframe auth token
 * @returns {{ removed: boolean, log: string[] }}
 */
export const removeTemplate = async ({ template, endpoint, token }) => {
  // services request url
  const remoteUrl = `${endpoint}/templates`;
  // construct shared request params
  const rmOptions = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method: 'DELETE',
    json: {
      templateName: template,
    },
    responseType: 'json',
  };
  try {
    const {
      body: { removed, log },
    } = await got(remoteUrl, rmOptions);
    return { removed, log };
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.response.statusCode === 401) {
      throw new Error('Authorization expired!');
    }

    throw e;
  }
};

/**
 * Adds new specified template to given exoframe endpoint
 * @param {object} params
 * @param {string} params.template - template to remove
 * @param {string} params.endpoint - exoframe server endpoint
 * @param {string} params.token - exoframe auth token
 * @returns {{ success: boolean, log: string[] }}
 */
export const addTemplate = async ({ template, endpoint, token }) => {
  // services request url
  const remoteUrl = `${endpoint}/templates`;
  // construct shared request params
  const options = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method: 'POST',
    json: {
      templateName: template,
    },
    responseType: 'json',
  };

  // try sending request
  try {
    const {
      body: { success, log },
    } = await got(remoteUrl, options);
    return { success, log };
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.response.statusCode === 401) {
      throw new Error('Authorization expired!');
    }

    throw e;
  }
};
