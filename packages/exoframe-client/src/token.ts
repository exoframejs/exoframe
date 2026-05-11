import got from 'got';
import { getStatusCode } from './http.ts';
import type { Token } from './types.ts';

interface TokenParams {
  endpoint: string;
  token: string;
}

interface NamedTokenParams extends TokenParams {
  name: string;
}

export const listTokens = async ({ endpoint, token }: TokenParams): Promise<Token[]> => {
  try {
    const {
      body: { tokens },
    } = await got.get<{ tokens: Token[] }>(`${endpoint}/deployToken`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'json',
    });
    return tokens;
  } catch (error) {
    if (getStatusCode(error) === 401) {
      throw new Error('Authorization expired!');
    }
    throw error;
  }
};

export const createToken = async ({ name, endpoint, token }: NamedTokenParams): Promise<Token> => {
  try {
    const { body } = await got.post<{ token: string }>(`${endpoint}/deployToken`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'json',
      json: {
        tokenName: name,
      },
    });
    return { name, value: body.token };
  } catch (error) {
    if (getStatusCode(error) === 401) {
      throw new Error('Authorization expired!');
    }
    throw error;
  }
};

export const removeToken = async ({ name, endpoint, token }: NamedTokenParams): Promise<boolean> => {
  try {
    const { body, statusCode } = await got.delete<{ reason?: string }>(`${endpoint}/deployToken`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'json',
      json: {
        tokenName: name,
      },
    });
    if (statusCode !== 204) {
      throw new Error(`Error removing deployment token! ${body.reason || 'Please try again!'}`);
    }

    return true;
  } catch (error) {
    if (getStatusCode(error) === 401) {
      throw new Error('Authorization expired!');
    }
    throw error;
  }
};
