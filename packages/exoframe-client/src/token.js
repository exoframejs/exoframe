import got from 'got';

export const listTokens = async ({ endpoint, token }) => {
  // services request url
  const remoteUrl = `${endpoint}/deployToken`;
  // get tokens from server
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
      body: { tokens },
    } = await got(remoteUrl, options);
    return tokens;
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.response.statusCode === 401) {
      throw new Error('Authorization expired!');
    }

    throw e;
  }
};

export const createToken = async ({ name, endpoint, token }) => {
  // services request url
  const remoteUrl = `${endpoint}/deployToken`;
  // construct shared request params
  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: 'json',
    json: {
      tokenName: name,
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

export const removeToken = async ({ name, endpoint, token }) => {
  // services request url
  const remoteUrl = `${endpoint}/deployToken`;
  // construct shared request params
  const rmOptions = {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: 'json',
    json: {
      tokenName: name,
    },
  };
  try {
    const { body, statusCode } = await got(remoteUrl, rmOptions);
    if (statusCode !== 204) {
      throw new Error(`Error removing deployment token! ${body.reason || 'Please try again!'}`);
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
