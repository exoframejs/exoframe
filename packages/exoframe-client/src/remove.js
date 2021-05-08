import got from 'got';

export const removeDeployment = async ({ id, endpoint, token }) => {
  // services request url
  const remoteUrl = `${endpoint}/remove/${encodeURIComponent(id)}`;

  // construct shared request params
  const options = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    json: {},
  };

  // try sending request
  try {
    const { statusCode } = await got.post(remoteUrl, options);
    if (statusCode === 204) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.response.statusCode === 401) {
      throw new Error('Authorization expired!');
    }

    // if container was not found
    if (e.response.statusCode === 404) {
      throw new Error('Container or function was not found!');
    }

    throw e;
  }
};
