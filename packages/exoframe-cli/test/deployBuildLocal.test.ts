import { join } from 'path';
import { setTimeout } from 'timers/promises';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getUserConfig, setupDeployMocks } from './util/config.ts';
import { fixturesFolder } from './util/paths.ts';

// mock deploy in client to check params passed from cli
const deployMock = vi.fn(async () => ({
  formattedServices: [
    {
      deploymentName: 'test',
      name: 'test',
      domain: 'localhost',
      host: 'test',
      status: '',
      project: 'test',
      type: 'Container',
    },
  ],
  log: [],
}));
vi.mock('exoframe-client', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, deploy: (...args) => deployMock(...args) };
});

// timeout for IO / net
const IO_TIMEOUT = 50;

const testFolder = join(fixturesFolder, 'test_html_project');

let program;
let clearMocks;
beforeEach(async () => {
  clearMocks = setupDeployMocks();
  const { createProgram } = await import('../src/index.ts');
  program = await createProgram();
});
afterEach(() => {
  clearMocks();
  deployMock.mockReset();
  vi.restoreAllMocks();
});

test('Should not build locally by default', async () => {
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  await program.parseAsync(['deploy', testFolder], { from: 'user' });
  await setTimeout(IO_TIMEOUT);

  expect(deployMock).toHaveBeenCalledTimes(1);
  expect(deployMock.mock.calls[0][0]).toMatchObject({ buildLocal: undefined });

  consoleSpy.mockReset();
});

test('Should pass local build flag to client', async () => {
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  await program.parseAsync(['deploy', '--build-local', testFolder], { from: 'user' });
  await setTimeout(IO_TIMEOUT);

  expect(deployMock).toHaveBeenCalledTimes(1);
  expect(deployMock.mock.calls[0][0]).toMatchObject({ buildLocal: true });

  consoleSpy.mockReset();
});

test('Should pass local build flag when deploying with token', async () => {
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  await program.parseAsync(['deploy', '-b', '-t', 'deploy-token', testFolder], { from: 'user' });
  await setTimeout(IO_TIMEOUT);

  expect(deployMock).toHaveBeenCalledTimes(1);
  expect(deployMock.mock.calls[0][0]).toMatchObject({ buildLocal: true, token: 'deploy-token' });

  consoleSpy.mockReset();
});

test('Should pass build platform to client', async () => {
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  await program.parseAsync(['deploy', '-b', '--platform', 'linux/amd64', testFolder], { from: 'user' });
  await setTimeout(IO_TIMEOUT);

  expect(deployMock.mock.calls[0][0]).toMatchObject({ buildLocal: true, platform: 'linux/amd64' });

  consoleSpy.mockReset();
});

test('Should print docker log when local build fails', async () => {
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // error shape produced by the client for failed local builds
  const error = new Error('Local build failed! "docker build" exited with code 1.');
  error.response = { error: error.message, log: ['step 1/2 : FROM scratch', 'ERROR: missing.txt: not found'] };
  deployMock.mockRejectedValueOnce(error);

  await program.parseAsync(['deploy', '--build-local', testFolder], { from: 'user' });
  await setTimeout(IO_TIMEOUT);

  const output = consoleSpy.mock.calls.flat().join('\n');
  expect(output).toContain('Local build failed! "docker build" exited with code 1.');
  expect(output).toContain('ERROR: missing.txt: not found');

  consoleSpy.mockReset();
});

test('Should log out when token expires while resolving the build user', async () => {
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  // the client reports every 401 by message, including the token check that precedes a local build
  deployMock.mockRejectedValueOnce(new Error('Authorization expired!'));

  await program.parseAsync(['deploy', '--build-local', testFolder], { from: 'user' });
  await setTimeout(IO_TIMEOUT);

  expect(consoleSpy.mock.calls.flat().join('\n')).toContain('Error: authorization expired!');
  const cfg = await getUserConfig();
  expect(cfg.user).toBeUndefined();
  expect(cfg.token).toBeUndefined();

  consoleSpy.mockReset();
});
