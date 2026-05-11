import got from 'got';
import { getStatusCode } from './http.ts';
import type { FormattedService, ServiceSpec } from './types.ts';
import { formatServices } from './utils/formatServices.ts';

interface ListDeploymentsParams {
  endpoint: string;
  token: string;
}

export const listDeployments = async ({ endpoint, token }: ListDeploymentsParams): Promise<FormattedService[]> => {
  const remoteUrl = `${endpoint}/list`;
  const options = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: 'json' as const,
  };

  let containers: ServiceSpec[] = [];
  try {
    const { body } = await got.get<{ containers?: ServiceSpec[] }>(remoteUrl, options);
    if (!body) {
      throw new Error('Server returned empty response!');
    }

    ({ containers = [] } = body);
  } catch (error) {
    if (getStatusCode(error) === 401) {
      throw new Error('Authorization expired!');
    }

    throw error;
  }

  return formatServices(containers);
};
