import got from 'got';
import { getStatusCode } from './http.ts';
import type { TemplateMutationResult } from './types.ts';

interface TemplateParams {
  endpoint: string;
  token: string;
}

interface TemplateMutationParams extends TemplateParams {
  template: string;
}

export const listTemplates = async ({ endpoint, token }: TemplateParams): Promise<Record<string, string>> => {
  try {
    const { body } = await got.get<Record<string, string>>(`${endpoint}/templates`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'json',
    });
    return body;
  } catch (error) {
    if (getStatusCode(error) === 401) {
      throw new Error('Authorization expired!');
    }
    throw error;
  }
};

export const removeTemplate = async ({
  template,
  endpoint,
  token,
}: TemplateMutationParams): Promise<TemplateMutationResult> => {
  try {
    const {
      body: { removed, log },
    } = await got.delete<TemplateMutationResult>(`${endpoint}/templates`, {
      headers: { Authorization: `Bearer ${token}` },
      json: {
        templateName: template,
      },
      responseType: 'json',
    });
    return { removed, log };
  } catch (error) {
    if (getStatusCode(error) === 401) {
      throw new Error('Authorization expired!');
    }
    throw error;
  }
};

export const addTemplate = async ({
  template,
  endpoint,
  token,
}: TemplateMutationParams): Promise<TemplateMutationResult> => {
  try {
    const {
      body: { success, log },
    } = await got.post<TemplateMutationResult>(`${endpoint}/templates`, {
      headers: { Authorization: `Bearer ${token}` },
      json: {
        templateName: template,
      },
      responseType: 'json',
    });
    return { success, log };
  } catch (error) {
    if (getStatusCode(error) === 401) {
      throw new Error('Authorization expired!');
    }
    throw error;
  }
};
