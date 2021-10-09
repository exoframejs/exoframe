import { describe, expect, jest, test } from '@jest/globals';
import { exec as execCb } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCb);

// set timeout to 0.5s
jest.setTimeout(500);

const shellOptions = {
  env: { HOME: '/root' },
};

describe('Test install script', () => {
  test('Should print help', async () => {
    const { stdout } = await exec('tools/install.sh -h');
    expect(stdout).toMatchSnapshot();
  });

  test('Should print only docker command', async () => {
    const { stdout } = await exec('tools/install.sh --dry-run --password PASSWORD -d EXAMPLE.COM', shellOptions);
    expect(stdout).toMatchSnapshot();
  });

  test('Should include mkdir command', async () => {
    const { stdout } = await exec(
      'tools/install.sh --dry-run --password PASSWORD -d EXAMPLE.COM -e EMAIL@GMAIL.COM',
      shellOptions
    );
    expect(stdout).toMatchSnapshot();
  });

  test('Should fail command', async () => {
    expect(exec('tools/install.sh -fail')).rejects.toThrow('Command failed: tools/install.sh -fail', shellOptions);
  });
});
