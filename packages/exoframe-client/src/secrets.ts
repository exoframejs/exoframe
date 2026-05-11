import got from 'got';
import { getStatusCode } from './http.ts';
import type { Secret } from './types.ts';

interface EndpointTokenParams {
  endpoint: string;
  token: string;
}

interface SecretNameParams extends EndpointTokenParams {
  name: string;
}

interface CreateSecretParams extends SecretNameParams {
  value: string;
}

export const listSecrets = async ({ endpoint, token }: EndpointTokenParams): Promise<Secret[]> => {
  try {
    const {
      body: { secrets },
    } = await got.get<{ secrets: Secret[] }>(`${endpoint}/secrets`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'json',
    });
    return secrets;
  } catch (error) {
    if (getStatusCode(error) === 401) {
      throw new Error('Authorization expired!');
    }
    throw error;
  }
};

export const createSecret = async ({ name, value, endpoint, token }: CreateSecretParams): Promise<Secret> => {
  try {
    const { body } = await got.post<Secret>(`${endpoint}/secrets`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'json',
      json: {
        secretName: name,
        secretValue: value,
      },
    });
    return body;
  } catch (error) {
    if (getStatusCode(error) === 401) {
      throw new Error('Authorization expired!');
    }
    throw error;
  }
};

export const getSecret = async ({ name, endpoint, token }: SecretNameParams): Promise<Secret> => {
  try {
    const {
      body: { secret },
    } = await got.get<{ secret: Secret }>(`${endpoint}/secrets/${name}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'json',
    });
    return secret;
  } catch (error) {
    if (getStatusCode(error) === 401) {
      throw new Error('Authorization expired!');
    }
    throw error;
  }
};

export const removeSecret = async ({ name, endpoint, token }: SecretNameParams): Promise<boolean> => {
  try {
    const { body, statusCode } = await got.delete<{ reason?: string }>(`${endpoint}/secrets`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'json',
      json: {
        secretName: name,
      },
    });
    if (statusCode !== 204) {
      throw new Error(`Error removing deployment secret: ${body.reason || 'Please try again!'}`);
    }

    return true;
  } catch (error) {
    if (getStatusCode(error) === 401) {
      throw new Error('Authorization expired!');
    }
    throw error;
  }
};
