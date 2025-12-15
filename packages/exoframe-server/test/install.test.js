import { exec as execCb } from 'child_process';
import { mkdir, rm, writeFile } from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import { beforeEach, describe, expect, test } from 'vitest';

const exec = promisify(execCb);

const testHome = path.join(process.cwd(), '.test-home');
const configHome = path.join(testHome, '.config');
const shellOptions = { env: { ...process.env, HOME: testHome, XDG_CONFIG_HOME: configHome } };
const configDir = path.join(configHome, 'exoframe');
const configPath = path.join(configDir, 'server.config.yml');
const normalizeOutput = (output) => output.replaceAll(testHome, '<TEST_HOME>');

beforeEach(() => rm(testHome, { recursive: true, force: true }).catch(() => {}));

describe('Test install script', () => {
  test('Should print help', async () => {
    const { stdout } = await exec('tools/install.sh -h', shellOptions);
    expect(stdout).toMatchInlineSnapshot(`
      "
      Usage:
        -D, --dry-run     Dry run. Print command instead of executing it.
        -e, --email       Enter email to enable SSL support.
        -d, --domain      * Enter exoframe-server domain.
        -p, --password    * Enter your private key used for JWT encryption.

      "
    `);
  });

  test('Should print only docker command', async () => {
    const { stdout } = await exec(
      'tools/install.sh --dry-run --password PASSWORD -d exoframe.EXAMPLE.COM',
      shellOptions
    );
    expect(normalizeOutput(stdout)).toMatchInlineSnapshot(`
      "
      Commands to run inside server:

      docker run -d -v /var/run/docker.sock:/var/run/docker.sock -v <TEST_HOME>/.config/exoframe:/root/.config/exoframe -v <TEST_HOME>/.ssh/authorized_keys:/root/.ssh/authorized_keys:ro -e EXO_PRIVATE_KEY=PASSWORD --label traefik.enable=true --label traefik.http.routers.exoframe-server.rule=Host(\`exoframe.EXAMPLE.COM\`) --restart always --name exoframe-server exoframe/server
      "
    `);
  });

  test('Should include mkdir command', async () => {
    const { stdout } = await exec(
      'tools/install.sh --dry-run --password PASSWORD -d exoframe.EXAMPLE.COM -e EMAIL@GMAIL.COM',
      shellOptions
    );
    expect(normalizeOutput(stdout)).toMatchInlineSnapshot(`
      "
      Commands to run inside server:

      mkdir -p <TEST_HOME>/.config/exoframe && touch <TEST_HOME>/.config/exoframe/server.config.yml
      echo "letsencrypt: true" >> <TEST_HOME>/.config/exoframe/server.config.yml
      echo "letsencryptEmail: EMAIL@GMAIL.COM" >> <TEST_HOME>/.config/exoframe/server.config.yml


      docker run -d -v /var/run/docker.sock:/var/run/docker.sock -v <TEST_HOME>/.config/exoframe:/root/.config/exoframe -v <TEST_HOME>/.ssh/authorized_keys:/root/.ssh/authorized_keys:ro -e EXO_PRIVATE_KEY=PASSWORD --label traefik.enable=true --label traefik.http.routers.exoframe-server.rule=Host(\`exoframe.EXAMPLE.COM\`) --label traefik.http.routers.exoframe-server-web.rule=Host(\`exoframe.EXAMPLE.COM\`) --label traefik.http.routers.exoframe-server.tls.certresolver=exoframeChallenge --label traefik.http.middlewares.exoframe-server-redirect.redirectscheme.scheme=https --label traefik.http.routers.exoframe-server-web.entrypoints=web --label traefik.http.routers.exoframe-server-web.middlewares=exoframe-server-redirect@docker --label traefik.http.routers.exoframe-server.entrypoints=websecure --label entryPoints.web.address=:80 --label entryPoints.websecure.address=:443 --restart always --name exoframe-server exoframe/server
      "
    `);
  });

  test('Should reuse config values without rewriting', async () => {
    await mkdir(configDir, { recursive: true });
    await writeFile(configPath, 'letsencrypt: true\nletsencryptEmail: EMAIL@GMAIL.COM\n', 'utf8');

    const { stdout } = await exec(
      'tools/install.sh --dry-run --password PASSWORD -d exoframe.EXAMPLE.COM',
      shellOptions
    );
    expect(normalizeOutput(stdout)).toMatchInlineSnapshot(`
      "Reusing SSL setting from config

      Commands to run inside server:


      docker run -d -v /var/run/docker.sock:/var/run/docker.sock -v <TEST_HOME>/.config/exoframe:/root/.config/exoframe -v <TEST_HOME>/.ssh/authorized_keys:/root/.ssh/authorized_keys:ro -e EXO_PRIVATE_KEY=PASSWORD --label traefik.enable=true --label traefik.http.routers.exoframe-server.rule=Host(\`exoframe.EXAMPLE.COM\`) --label traefik.http.routers.exoframe-server-web.rule=Host(\`exoframe.EXAMPLE.COM\`) --label traefik.http.routers.exoframe-server.tls.certresolver=exoframeChallenge --label traefik.http.middlewares.exoframe-server-redirect.redirectscheme.scheme=https --label traefik.http.routers.exoframe-server-web.entrypoints=web --label traefik.http.routers.exoframe-server-web.middlewares=exoframe-server-redirect@docker --label traefik.http.routers.exoframe-server.entrypoints=websecure --label entryPoints.web.address=:80 --label entryPoints.websecure.address=:443 --restart always --name exoframe-server exoframe/server
      "
    `);
  });

  test('Should fail command', async () => {
    await expect(exec('tools/install.sh -fail')).rejects.toThrow(
      'Command failed: tools/install.sh -fail',
      shellOptions
    );
  });
});
