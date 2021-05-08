import got from 'got';

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
