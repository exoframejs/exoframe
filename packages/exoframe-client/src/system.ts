import got from 'got';
import { getStatusCode } from './http.ts';

interface PruneSystemParams {
  endpoint: string;
  token: string;
}

interface PruneItem {
  SpaceReclaimed: number;
}

export const pruneSystem = async ({ endpoint, token }: PruneSystemParams): Promise<{ prunedBytes: number }> => {
  try {
    const { body } = await got.post<{ data: PruneItem[] }>(`${endpoint}/system/prune`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'json',
      json: {},
    });
    return { prunedBytes: body.data.map((item) => item.SpaceReclaimed).reduce((acc, value) => acc + value, 0) };
  } catch (error) {
    if (getStatusCode(error) === 401) {
      throw new Error('Authorization expired!');
    }
    throw error;
  }
};
