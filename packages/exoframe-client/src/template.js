// npm packages
import got from 'got';

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
