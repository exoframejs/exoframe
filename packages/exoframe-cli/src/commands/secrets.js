import { Command } from 'commander';
import { addSecretHandler } from '../handlers/secrets/add.js';
import { getSecretHandler } from '../handlers/secrets/get.js';
import { listSecretsHandler } from '../handlers/secrets/list.js';
import { removeSecretHandler } from '../handlers/secrets/remove.js';

export const createSecretsCmd = () => {
  const secretsCmd = new Command('secret');

  secretsCmd
    .command('add')
    .description('add new deployment secret')
    .option('-n, --name [name]', 'Name for new secret')
    .option('-v, --value [value]', 'Value for new secret')
    .action(addSecretHandler);

  secretsCmd.command('list').alias('ls').description('list existing deployment secrets').action(listSecretsHandler);

  secretsCmd
    .command('get')
    .description('get existing deployment secret value')
    .argument('[name]', 'Name of secret to get')
    .option('-y, --yes', 'Skip display confirmation')
    .action(getSecretHandler);

  secretsCmd
    .command('remove')
    .alias('rm')
    .description('remove existing deployment secret')
    .argument('[name]', 'Name of secret to get')
    .action(removeSecretHandler);

  return secretsCmd;
};
