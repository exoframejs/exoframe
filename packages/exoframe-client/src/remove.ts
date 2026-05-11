import got from 'got';
import { getStatusCode } from './http.ts';

interface RemoveDeploymentParams {
  id: string;
  endpoint: string;
  token: string;
}

export const removeDeployment = async ({ id, endpoint, token }: RemoveDeploymentParams): Promise<boolean> => {
  const remoteUrl = `${endpoint}/remove/${encodeURIComponent(id)}`;
  const options = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    json: {},
  };

  try {
    const { statusCode } = await got.post(remoteUrl, options);
    return statusCode === 204;
  } catch (error) {
    if (getStatusCode(error) === 401) {
      throw new Error('Authorization expired!');
    }

    if (getStatusCode(error) === 404) {
      throw new Error('Container or function was not found!');
    }

    throw error;
  }
};
