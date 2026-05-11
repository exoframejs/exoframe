import got from 'got';
import { getStatusCode } from './http.ts';
import type { UpdateResult } from './types.ts';

const validTargets = ['traefik', 'server', 'all'] as const;
type UpdateTarget = (typeof validTargets)[number];

interface UpdateParams {
  endpoint: string;
  token: string;
}

interface ExecuteUpdateParams extends UpdateParams {
  target?: UpdateTarget;
}

export const checkUpdates = async ({ endpoint, token }: UpdateParams): Promise<UpdateResult> => {
  try {
    const { body, statusCode } = await got.get<UpdateResult & { error?: string }>(`${endpoint}/version`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'json',
    });
    if (statusCode !== 200 || body.error) {
      throw new Error(body.error || 'Oops. Something went wrong! Try again please.');
    }

    return body;
  } catch (error) {
    if (getStatusCode(error) === 401) {
      throw new Error('Authorization expired!');
    }
    throw error;
  }
};

export const executeUpdate = async ({
  target = 'all',
  endpoint,
  token,
}: ExecuteUpdateParams): Promise<UpdateResult> => {
  if (!validTargets.includes(target)) {
    throw new Error('Invalid target!');
  }

  try {
    const { body, statusCode } = await got.post<UpdateResult & { error?: string }>(`${endpoint}/update/${target}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'json',
      json: {},
    });
    if (statusCode !== 200 || body.error) {
      throw new Error(body.error || 'Oops. Something went wrong! Try again please.');
    }

    return body;
  } catch (error) {
    if (getStatusCode(error) === 401) {
      throw new Error('Authorization expired!');
    }
    throw error;
  }
};
