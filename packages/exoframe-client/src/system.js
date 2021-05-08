// npm packages
import got from 'got';

export const pruneSystem = async ({ endpoint, token }) => {
  // services request url
  const remoteUrl = `${endpoint}/system/prune`;

  // construct shared request params
  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: 'json',
    json: {},
  };

  // try sending request
  try {
    const { body } = await got(remoteUrl, options);
    return { prunedBytes: body.data.map((item) => item.SpaceReclaimed).reduce((acc, val) => acc + val, 0) };
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.response.statusCode === 401) {
      throw new Error('Authorization expired!');
    }

    throw e;
  }
};
