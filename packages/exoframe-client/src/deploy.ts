import { readFile, stat, writeFile } from 'fs/promises';
import got from 'got';
import _ from 'highland';
import multimatch from 'multimatch';
import path from 'path';
import { serializeError } from 'serialize-error';
import tar from 'tar-fs';
import { EXOFRAME_CONFIG_SCHEMA_URL } from './config.ts';
import type {
  Config,
  DeployParams,
  DeployResponseData,
  DeployResult,
  LogEntry,
  NestedValue,
  StreamToResponseParams,
  TarMapHeaders,
} from './types.ts';
import { formatServices } from './utils/formatServices.ts';

const defaultIgnores = ['.git', 'node_modules', '.exoframeignore'];

type ResponseError = Error & {
  response?: DeployResponseData | { error: string } | { statusCode?: number };
};

const folderToWorkdir = (folder?: string): string => {
  const cwd = process.cwd();
  if (!folder) {
    return cwd;
  }

  if (path.isAbsolute(folder)) {
    return folder;
  }

  return path.join(cwd, folder);
};

const streamToResponse = async ({
  tarStream,
  remoteUrl,
  options,
  verbose = 0,
  log = () => {},
}: StreamToResponseParams): Promise<DeployResponseData | undefined> => {
  let error: ResponseError | undefined;
  let result: DeployResponseData | undefined;
  const requestOptions = options as { headers?: Record<string, string> } | undefined;

  return new Promise((resolve, reject) => {
    const stream = _(tarStream.pipe(got.stream.post(remoteUrl, requestOptions)))
      .split()
      .filter((line: string) => Boolean(line?.length));

    stream.on('data', (value: string) => {
      const serialized = value.toString();
      try {
        const data = JSON.parse(serialized) as DeployResponseData;
        if (data.level === 'info') {
          if (verbose) {
            log('[info]', data.message);
          }
          if (data.deployments) {
            result = data;
          }
        }
        if (data.level === 'verbose' && verbose > 1) {
          log('[verbose]', data.message);
        }
        if (data.level === 'error') {
          if (verbose) {
            log('[error]', data.message);
          }
          if (verbose > 1) {
            log(JSON.stringify(data, null, 2));
          }
          const requestError: ResponseError = new Error(data.message);
          requestError.response = data;
          error = requestError;
        }
      } catch {
        const parseError: ResponseError = new Error('Error parsing output!');
        parseError.response = { error: serialized };
        error = parseError;
        if (verbose) {
          log('[error]', 'Error parsing line:', serialized);
        }
      }
    });

    stream.on('end', () => {
      if (error !== undefined) {
        reject(error);
        return;
      }
      resolve(result);
    });

    stream.on('error', (streamError: Error) => {
      error = streamError as ResponseError;
    });
  });
};

export const deploy = async ({
  folder,
  endpoint,
  token,
  update,
  configFile = 'exoframe.json',
  verbose = 0,
}: DeployParams): Promise<DeployResult> => {
  const loglist: LogEntry[] = [];
  const log = (...args: NestedValue[]) => {
    if (verbose > 1) console.log(...args);
    loglist.push(args);
  };

  if (!token) {
    throw new Error('No deployment token provided!');
  }

  const workdir = folderToWorkdir(folder);
  const folderName = path.basename(workdir);
  const remoteUrl = `${endpoint}/${update ? 'update' : 'deploy'}`;

  await stat(workdir);

  const configPath = path.join(workdir, configFile);
  try {
    await stat(configPath);
  } catch {
    const defaultConfig = JSON.stringify({ $schema: EXOFRAME_CONFIG_SCHEMA_URL, name: folderName });
    await writeFile(configPath, defaultConfig, 'utf-8');
    if (verbose) {
      log('Create new default config:', defaultConfig);
    }
  }

  let config: Config;
  try {
    config = JSON.parse(await readFile(configPath, 'utf-8')) as Config;
  } catch (error) {
    throw new Error(`Your exoframe.json is not valid: ${JSON.stringify(serializeError(error), null, 2)}`);
  }

  if (!config.name || !config.name.length) {
    throw new Error('Project should have a valid name in config!');
  }

  const ignorePath = path.join(workdir, '.exoframeignore');
  let ignores = [...defaultIgnores];
  try {
    ignores = (await readFile(ignorePath, 'utf-8'))
      .split('\n')
      .filter((line) => line.length > 0)
      .concat('.exoframeignore');
  } catch {
    if (verbose) {
      log('\nNo .exoframeignore file found, using default ignores');
    }
  }

  if (configFile !== 'exoframe.json') {
    ignores.push('exoframe.json');
  }

  const tarStream = tar.pack(workdir, {
    ignore: (name: string) => multimatch([path.relative(workdir, name)], ignores).length !== 0,
    map: (headers: TarMapHeaders) => {
      if (headers.name === configFile) {
        return { ...headers, name: 'exoframe.json' };
      }
      return headers;
    },
  });
  if (verbose) {
    log('\nIgnoring following paths:', ignores);
  }

  const options = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' } };
  const response = await streamToResponse({ tarStream, remoteUrl, options, verbose, log });

  if (!response?.deployments?.length) {
    const error = new Error('Something went wrong!');
    Object.assign(error, { response });
    throw error;
  }

  if (verbose > 2) {
    log('Server response:', JSON.stringify(response, null, 2), '\n');
  }
  return { formattedServices: formatServices(response.deployments), log: loglist };
};
