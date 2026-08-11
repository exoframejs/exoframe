import { execFile } from 'child_process';
import { buildLocally, deploy, localImageFile } from 'exoframe-client';
import { mkdtemp, readdir, readFile, rm } from 'fs/promises';
import _ from 'highland';
import nock from 'nock';
import { tmpdir } from 'os';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import tar from 'tar-fs';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest';
import { gunzipSync } from 'zlib';

// these tests use the local docker daemon, building tiny scratch-based images from the fixtures,
// which is far slower than the mocked requests the rest of the suite makes
vi.setConfig({ testTimeout: 60000, hookTimeout: 60000 });

const execFileAsync = promisify(execFile);

// reply with stream helper
const replyWithStream = (dataArr: object[]) => {
  const replyStream = _();
  dataArr.forEach((data) => replyStream.write(JSON.stringify(data)));
  replyStream.end();
  return replyStream.toNodeStream();
};

const baseFolder = path.dirname(fileURLToPath(import.meta.url));

const folder = 'test_local_build_project';
const folderPath = path.join('test', 'fixtures', folder);
const testFolder = path.join(baseFolder, 'fixtures', folder);

const configFolder = 'test_local_build_config_project';
const configFolderPath = path.join('test', 'fixtures', configFolder);
const configTestFolder = path.join(baseFolder, 'fixtures', configFolder);

const secretTestFolder = path.join(baseFolder, 'fixtures', 'test_local_build_secret_project');
const failingTestFolder = path.join(baseFolder, 'fixtures', 'test_local_build_failing_project');
const htmlTestFolder = path.join(baseFolder, 'fixtures', 'test_html_project');
const htmlFolderPath = path.join('test', 'fixtures', 'test_html_project');

const deployments = [
  {
    Id: '123',
    Name: '/test',
    Config: { Labels: { 'exoframe.deployment': 'test', 'traefik.http.routers.test.rule': 'Host(`localhost`)' } },
    NetworkSettings: { Networks: { exoframe: { Aliases: ['123', 'test'] } } },
  },
];

const endpoint = 'http://localhost:8080';

// all image tags the tests may produce
const testImages = [
  'exo-admin-test-local-build:latest',
  'exo-admin-test-local-build-config:latest',
  'exo-token-user-test-local-build:latest',
  'exo-admin-test-html-project:latest',
];

// reads a property of a locally built image, undefined if the image doesn't exist
const inspectImage = async (image: string, format = '{{.Id}}'): Promise<string | undefined> => {
  try {
    const { stdout } = await execFileAsync('docker', ['image', 'inspect', image, '--format', format]);
    return stdout.trim();
  } catch {
    return undefined;
  }
};

// lists leftover local build temp folders
const getBuildFolders = async () =>
  (await readdir(tmpdir())).filter((entry) => entry.startsWith('exoframe-build-')).sort();

// unpacks a deployment tar into a temp folder and returns its contents
const extractUpload = async (body: Buffer) => {
  const target = await mkdtemp(path.join(tmpdir(), 'exoframe-upload-'));
  try {
    await pipeline(Readable.from(body), tar.extract(target));
    const files = (await readdir(target)).sort();
    const config = JSON.parse(await readFile(path.join(target, 'exoframe.json'), 'utf-8'));
    const image = await readFile(path.join(target, localImageFile));
    return { files, config, image };
  } finally {
    await rm(target, { recursive: true, force: true });
  }
};

// nock hands binary request bodies over as hex strings
const bodyToBuffer = (body: unknown): Buffer =>
  typeof body === 'string'
    ? Buffer.from(body, /^[0-9a-f]*$/.test(body) ? 'hex' : 'utf-8')
    : Buffer.from(body as Buffer);

afterEach(() => {
  // a failed test leaves its interceptors behind, which would then swallow the next test's request
  nock.cleanAll();
});

// same tags could already exist on the machine running the tests - those aren't ours to remove
let preexistingImages: string[] = [];
beforeAll(async () => {
  const found = await Promise.all(testImages.map(async (image) => ((await inspectImage(image)) ? image : undefined)));
  preexistingImages = found.filter((image) => image !== undefined);
});

afterAll(async () => {
  const built = testImages.filter((image) => !preexistingImages.includes(image));
  if (built.length > 0) {
    await execFileAsync('docker', ['image', 'rm', '-f', ...built]).catch(() => {});
  }
});

test('Should build image locally and pack it for deployment', async () => {
  const config = JSON.parse(await readFile(path.join(testFolder, 'exoframe.json'), 'utf-8'));
  const result = await buildLocally({
    workdir: testFolder,
    config,
    username: 'admin',
    contextStream: tar.pack(testFolder),
  });

  try {
    // image tag should mirror the server-side tag
    expect(result.image).toEqual('exo-admin-test-local-build:latest');
    // and docker should now have that image
    expect(await inspectImage(result.image)).toBeDefined();

    // build folder should only contain the config and the saved image
    const files = await readdir(result.folder);
    expect(files.sort()).toEqual(['exoframe.json', localImageFile]);

    // config should point the server at the shipped image
    const deployConfig = JSON.parse(await readFile(path.join(result.folder, 'exoframe.json'), 'utf-8'));
    expect(deployConfig.name).toEqual('test-local-build');
    expect(deployConfig.image).toEqual('exo-admin-test-local-build:latest');
    expect(deployConfig.imageFile).toEqual(localImageFile);
    // server only loads the image, so the image template has to be used no matter what the project says
    expect(deployConfig.template).toEqual('image');

    // saved file should be a gzipped docker image tar
    const savedImage = await readFile(path.join(result.folder, localImageFile));
    expect(savedImage.length).toBeGreaterThan(0);
    expect(gunzipSync(savedImage).toString('binary')).toContain('manifest.json');
  } finally {
    await rm(result.folder, { recursive: true, force: true });
  }
});

test('Should pass platform and build args to docker', async () => {
  const config = JSON.parse(await readFile(path.join(configTestFolder, 'exoframe.json'), 'utf-8'));
  const result = await buildLocally({
    workdir: configTestFolder,
    config,
    username: 'admin',
    platform: 'linux/386',
    contextStream: tar.pack(configTestFolder),
  });

  try {
    // tests never run on this platform, so it can only come from the given param
    expect(await inspectImage(result.image, '{{.Os}}/{{.Architecture}}')).toEqual('linux/386');
    // fixture writes the build arg into an image label
    expect(await inspectImage(result.image, '{{index .Config.Labels "my-arg"}}')).toEqual('my-value');
  } finally {
    await rm(result.folder, { recursive: true, force: true });
  }
});

test('Should not build locally without a Dockerfile', async () => {
  const config = JSON.parse(await readFile(path.join(htmlTestFolder, 'exoframe.json'), 'utf-8'));

  await expect(
    buildLocally({ workdir: htmlTestFolder, config, username: 'admin', contextStream: tar.pack(htmlTestFolder) })
  ).rejects.toThrow('Local builds require a Dockerfile in the project folder!');

  // docker should not have built anything
  expect(await inspectImage('exo-admin-test-html-project:latest')).toBeUndefined();
});

test('Should not build locally with build args referencing server secrets', async () => {
  const config = JSON.parse(await readFile(path.join(secretTestFolder, 'exoframe.json'), 'utf-8'));

  await expect(
    buildLocally({ workdir: secretTestFolder, config, username: 'admin', contextStream: tar.pack(secretTestFolder) })
  ).rejects.toThrow('Build arg "MY_SECRET" references server secret "@my-secret"');
});

test('Should report missing docker', async () => {
  const currentPath = process.env.PATH;
  // hide the real docker from the build
  process.env.PATH = '';
  const config = JSON.parse(await readFile(path.join(testFolder, 'exoframe.json'), 'utf-8'));

  try {
    await expect(
      buildLocally({ workdir: testFolder, config, username: 'admin', contextStream: tar.pack(testFolder) })
    ).rejects.toThrow('Docker not found! You need to install Docker');
  } finally {
    process.env.PATH = currentPath;
  }
});

test('Should report docker build failure with log', async () => {
  const buildFoldersBefore = await getBuildFolders();
  const config = JSON.parse(await readFile(path.join(failingTestFolder, 'exoframe.json'), 'utf-8'));

  try {
    await buildLocally({
      workdir: failingTestFolder,
      config,
      username: 'admin',
      contextStream: tar.pack(failingTestFolder),
    });
    expect.unreachable('Local build should have failed');
  } catch (err) {
    expect(err.message).toContain('Local build failed!');
    // docker output lives in the response, not in the message
    expect(err.message).not.toContain('does-not-exist.txt');
    expect(err.response.log.join('\n')).toContain('does-not-exist.txt');
  }

  // failed build should not leave temp folders behind
  expect(await getBuildFolders()).toEqual(buildFoldersBefore);
});

test('Should deploy locally built image', async () => {
  const buildFoldersBefore = await getBuildFolders();

  // username for the image tag comes from the server when the caller doesn't know it
  const tokenServer = nock(endpoint)
    .get('/checkToken')
    .reply(200, { credentials: { username: 'admin' } });
  // handle correct request
  let uploaded: Buffer | undefined;
  const deployServer = nock(endpoint)
    .post('/deploy')
    .reply(200, (_uri, requestBody) => {
      uploaded = bodyToBuffer(requestBody);
      return replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]);
    });

  const result = await deploy({
    folder: folderPath,
    endpoint,
    token: 'test-token',
    buildLocal: true,
  });

  expect(tokenServer.isDone()).toBeTruthy();
  expect(deployServer.isDone()).toBeTruthy();
  expect(result.formattedServices.length).toEqual(1);

  // only the built image and its config should be uploaded, no sources
  const upload = await extractUpload(uploaded!);
  expect(upload.files).toEqual(['exoframe.json', localImageFile]);
  expect(upload.config.image).toEqual('exo-admin-test-local-build:latest');
  expect(upload.config.imageFile).toEqual(localImageFile);
  expect(upload.config.template).toEqual('image');
  expect(upload.image.length).toBeGreaterThan(0);

  // temp build folder should be cleaned up after deployment
  expect(await getBuildFolders()).toEqual(buildFoldersBefore);

  tokenServer.done();
  deployServer.done();
});

test('Should build locally when enabled in project config', async () => {
  const tokenServer = nock(endpoint)
    .get('/checkToken')
    .reply(200, { credentials: { username: 'admin' } });
  let uploaded: Buffer | undefined;
  const deployServer = nock(endpoint)
    .post('/deploy')
    .reply(200, (_uri, requestBody) => {
      uploaded = bodyToBuffer(requestBody);
      return replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]);
    });

  await deploy({ folder: configFolderPath, endpoint, token: 'test-token' });

  expect(deployServer.isDone()).toBeTruthy();
  const upload = await extractUpload(uploaded!);
  expect(upload.files).toEqual(['exoframe.json', localImageFile]);
  expect(upload.config.image).toEqual('exo-admin-test-local-build-config:latest');
  // platform from the project config should be used for the build
  expect(await inspectImage(upload.config.image, '{{.Os}}/{{.Architecture}}')).toEqual('linux/386');

  tokenServer.done();
  deployServer.done();
});

test('Should prefer given platform over the one in project config', async () => {
  const tokenServer = nock(endpoint)
    .get('/checkToken')
    .reply(200, { credentials: { username: 'admin' } });
  const deployServer = nock(endpoint)
    .post('/deploy')
    .reply(200, () => replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]));

  // fixture config asks for linux/386
  await deploy({ folder: configFolderPath, endpoint, token: 'test-token', platform: 'linux/arm64' });

  expect(deployServer.isDone()).toBeTruthy();
  expect(await inspectImage('exo-admin-test-local-build-config:latest', '{{.Os}}/{{.Architecture}}')).toEqual(
    'linux/arm64'
  );

  tokenServer.done();
  deployServer.done();
});

test('Should update deployment with locally built image', async () => {
  const buildFoldersBefore = await getBuildFolders();

  const tokenServer = nock(endpoint)
    .get('/checkToken')
    .reply(200, { credentials: { username: 'admin' } });
  let uploaded: Buffer | undefined;
  const updateServer = nock(endpoint)
    .post('/update')
    .reply(200, (_uri, requestBody) => {
      uploaded = bodyToBuffer(requestBody);
      return replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]);
    });

  const result = await deploy({
    folder: folderPath,
    endpoint,
    token: 'test-token',
    update: true,
    buildLocal: true,
  });

  expect(tokenServer.isDone()).toBeTruthy();
  expect(updateServer.isDone()).toBeTruthy();
  expect(result.formattedServices.length).toEqual(1);

  // updates ship the image the same way deploys do
  const upload = await extractUpload(uploaded!);
  expect(upload.files).toEqual(['exoframe.json', localImageFile]);
  expect(upload.config.image).toEqual('exo-admin-test-local-build:latest');
  expect(upload.config.template).toEqual('image');
  expect(await getBuildFolders()).toEqual(buildFoldersBefore);

  tokenServer.done();
  updateServer.done();
});

test('Should tag image with username from token', async () => {
  const tokenServer = nock(endpoint)
    .get('/checkToken')
    .reply(200, { credentials: { username: 'token-user' } });
  const deployServer = nock(endpoint)
    .post('/deploy')
    .reply(200, () => replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]));

  await deploy({ folder: folderPath, endpoint, token: 'test-token', buildLocal: true });

  expect(tokenServer.isDone()).toBeTruthy();
  expect(deployServer.isDone()).toBeTruthy();

  // image should be tagged with the username resolved from the token
  expect(await inspectImage('exo-token-user-test-local-build:latest')).toBeDefined();

  tokenServer.done();
  deployServer.done();
});

test('Should fail before building when the token is rejected', async () => {
  const buildFoldersBefore = await getBuildFolders();
  // no /deploy interceptor - reaching the upload at all would fail the test
  const tokenServer = nock(endpoint).get('/checkToken').reply(401, { error: 'Authorization expired!' });

  await expect(deploy({ folder: folderPath, endpoint, token: 'bad-token', buildLocal: true })).rejects.toThrow(
    'Authorization expired!'
  );

  expect(tokenServer.isDone()).toBeTruthy();
  expect(await getBuildFolders()).toEqual(buildFoldersBefore);

  tokenServer.done();
});

test('Should not build locally by default', async () => {
  const deployServer = nock(endpoint)
    .post('/deploy')
    .reply(200, () => replyWithStream([{ message: 'Deployment success!', deployments, level: 'info' }]));

  await deploy({ folder: htmlFolderPath, endpoint, token: 'test-token' });

  expect(deployServer.isDone()).toBeTruthy();
  expect(await inspectImage('exo-admin-test-html-project:latest')).toBeUndefined();

  deployServer.done();
});

test('Should fail deployment when local build fails', async () => {
  const tokenServer = nock(endpoint)
    .get('/checkToken')
    .reply(200, { credentials: { username: 'admin' } });

  try {
    await deploy({
      folder: path.join('test', 'fixtures', 'test_local_build_failing_project'),
      endpoint,
      token: 'test-token',
      buildLocal: true,
    });
    expect.unreachable('Deployment should have failed');
  } catch (err) {
    expect(err.message).toContain('Local build failed!');
    // docker output should be available to whoever renders the error
    expect(err.response.log.join('\n')).toContain('does-not-exist.txt');
  }

  tokenServer.done();
});
