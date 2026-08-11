import { spawn } from 'child_process';
import { createWriteStream } from 'fs';
import { mkdtemp, rm, stat, writeFile } from 'fs/promises';
import kebabCase from 'lodash/kebabCase.js';
import { tmpdir } from 'os';
import path from 'path';
import { pipeline } from 'stream/promises';
import { createGzip } from 'zlib';
import type { Config, LogFn } from './types.ts';

export const localImageFile = 'image.tar.gz';

interface RunDockerParams {
  args: string[];
  input?: NodeJS.ReadableStream;
  gzipPath?: string;
  log?: LogFn;
}

interface BuildLocallyParams {
  workdir: string;
  config: Config;
  username: string;
  platform?: string;
  contextStream: NodeJS.ReadableStream;
  log?: LogFn;
}

interface LocalBuildResult {
  folder: string;
  image: string;
}

type DockerError = Error & { response?: { error: string; log: string[] } };

const noop = () => {};

// KEEP IN SYNC with `tagFromConfig` in `exoframe-server` (`src/util/index.ts`), which is the source
// of truth for image tags. Locally built images are loaded into the server daemon under this tag, so
// if the two drift apart, repeat deploys stop replacing the previous image and pile up on the server.
// The two packages are deliberately independent, hence the copy rather than a shared import.
const localImageTag = ({ username, config }: { username: string; config: Config }) =>
  `exo-${kebabCase(username)}-${kebabCase(config.name)}:latest`;

// docker output is attached to the error response, mirroring the shape of server-side build errors
const dockerError = (message: string, log: string[]): DockerError => {
  const error: DockerError = new Error(message);
  error.response = { error: message, log };
  return error;
};

const runDocker = async ({ args, input, gzipPath, log = noop }: RunDockerParams) => {
  const proc = spawn('docker', args, { stdio: ['pipe', 'pipe', 'pipe'] });

  // collect logs so they can be attached to errors and shown without verbose mode
  const logLines: string[] = [];
  const record = (chunk: string) => {
    chunk
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .forEach((line) => {
        logLines.push(line);
        log(line);
      });
  };

  proc.stderr.setEncoding('utf-8');
  proc.stderr.on('data', record);

  const streams: Promise<void>[] = [];
  if (gzipPath) {
    // docker save writes uncompressed layers, so gzip roughly halves the upload; level 1 keeps the
    // cpu cost of that well below the time saved on the wire
    streams.push(pipeline(proc.stdout, createGzip({ level: 1 }), createWriteStream(gzipPath)));
  } else {
    proc.stdout.setEncoding('utf-8');
    proc.stdout.on('data', record);
  }

  if (input) {
    streams.push(pipeline(input, proc.stdin));
  } else {
    proc.stdin.end();
  }

  const { code, error } = await new Promise<{ code: number | null; error?: NodeJS.ErrnoException }>((resolve) => {
    proc.on('error', (spawnError: NodeJS.ErrnoException) => resolve({ code: null, error: spawnError }));
    proc.on('close', (exitCode) => resolve({ code: exitCode }));
  });

  const results = await Promise.allSettled(streams);

  if (error) {
    throw error;
  }

  if (code !== 0) {
    throw dockerError(`Local build failed! "docker ${args[0]}" exited with code ${String(code)}.`, logLines);
  }

  const failed = results.find((result) => result.status === 'rejected');
  if (failed) {
    throw failed.reason;
  }
};

// `docker version` reports the daemon version, so one call tells us both whether the docker cli
// exists and whether its daemon can be reached - no need to guess either from build output
const checkDocker = async () => {
  try {
    await runDocker({ args: ['version', '--format', '{{.Server.Version}}'] });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        'Docker not found! You need to install Docker and have it available in your PATH to build locally.'
      );
    }
    throw dockerError(
      'Could not connect to Docker! Make sure the Docker daemon is running to build locally.',
      (error as DockerError).response?.log ?? []
    );
  }
};

export const buildLocally = async ({
  workdir,
  config,
  username,
  platform,
  contextStream,
  log = noop,
}: BuildLocallyParams): Promise<LocalBuildResult> => {
  await checkDocker();

  try {
    await stat(path.join(workdir, 'Dockerfile'));
  } catch {
    throw new Error('Local builds require a Dockerfile in the project folder! Add one or deploy without local build.');
  }

  const buildargs = Object.entries(config.buildargs ?? {});
  const secretArg = buildargs.find(([, value]) => value.startsWith('@'));
  if (secretArg) {
    throw new Error(
      `Build arg "${secretArg[0]}" references server secret "${secretArg[1]}", which is not supported with local builds!`
    );
  }

  const image = localImageTag({ username, config });
  const args = ['build', '-t', image];
  if (platform) {
    args.push('--platform', platform);
  }
  buildargs.forEach(([key, value]) => args.push('--build-arg', `${key}=${value}`));
  // build with the deployment archive as context, so local builds see exactly what the server would
  args.push('-');

  log('\nBuilding image locally:', image);
  await runDocker({ args, input: contextStream, log });

  const folder = await mkdtemp(path.join(tmpdir(), 'exoframe-build-'));
  try {
    // force the image template - the shipped folder has no sources, so any template the project
    // config names (dockerfile, node, static, ..) would fail to build on the server
    const deployConfig: Config = { ...config, template: 'image', image, imageFile: localImageFile };
    await writeFile(path.join(folder, 'exoframe.json'), JSON.stringify(deployConfig, null, 2), 'utf-8');

    log('Saving image to:', path.join(folder, localImageFile));
    await runDocker({ args: ['save', image], gzipPath: path.join(folder, localImageFile), log });
  } catch (error) {
    await rm(folder, { recursive: true, force: true });
    throw error;
  }

  return { folder, image };
};
