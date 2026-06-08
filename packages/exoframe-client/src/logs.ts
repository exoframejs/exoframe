import EventEmitter from 'events';
import got from 'got';
import type { LogsEmitter } from './types.ts';

interface GetLogsParams {
  id: string;
  follow?: boolean;
  tail?: number | string;
  since?: string;
  until?: string;
  endpoint: string;
  token: string;
}

export const getLogs = ({ id, follow, tail, since, until, endpoint, token }: GetLogsParams): Promise<LogsEmitter> =>
  new Promise((resolve) => {
    const remoteUrl = `${endpoint}/logs/${id}`;
    const searchParams: Record<string, string> = {};
    if (follow) {
      searchParams.follow = 'true';
    }
    if (tail !== undefined) {
      searchParams.tail = String(tail);
    }
    if (since) {
      searchParams.since = since;
    }
    if (until) {
      searchParams.until = until;
    }

    const emitter = new EventEmitter() as LogsEmitter;
    const logStream = got.stream(remoteUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      searchParams,
    });

    logStream.on('error', (error: { response?: { statusCode?: number } }) => {
      if (error.response?.statusCode === 401) {
        emitter.emit('error', new Error('Authorization expired!'));
        return;
      }

      if (error.response?.statusCode === 404) {
        emitter.emit('error', new Error('Container was not found!'));
        return;
      }

      emitter.emit('error', error as Error);
    });

    logStream.on('end', () => emitter.emit('end'));
    logStream.on('data', (chunk: Buffer | string) => {
      chunk
        .toString()
        .split('\n')
        .map((line) => line.replace(/^\u0001.+?(\d)/g, '$1').replace(/\n+$/, ''))
        .filter((line) => line.length > 0)
        .map((line) => {
          if (line.startsWith('Logs for')) {
            return { date: null, msg: line };
          }

          const match = line.match(/^(.*?\dZ)\s(.*)$/);
          if (!match) {
            return { date: null, msg: line };
          }

          return { date: new Date(match[1]), msg: match[2] };
        })
        .filter((entry): entry is { date: Date | null; msg: string } => entry.msg !== undefined)
        .map(({ date, msg }) => ({
          date:
            date && Number.isFinite(date.getTime())
              ? `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
              : '  ',
          msg,
        }))
        .forEach((entry) => emitter.emit('data', entry));
    });

    resolve(emitter);
  });
