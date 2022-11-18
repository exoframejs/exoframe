import { Command } from 'commander';
import { tokenAddHandler } from '../handlers/token/add.js';
import { tokenListHandler } from '../handlers/token/list.js';
import { tokenRemoveHandler } from '../handlers/token/remove.js';

export const createTokenCmd = () => {
  const tokenCmd = new Command('token').description('manage deployment tokens');

  tokenCmd.command('list').alias('ls').description('List currently active deployment tokens').action(tokenListHandler);

  tokenCmd
    .command('add')
    .description('Generate new deployment token')
    .argument('[name]', 'Name of the template to install')
    .action(tokenAddHandler);

  tokenCmd
    .command('remove')
    .alias('rm')
    .description('Remove existing deployment token')
    .argument('[name]', 'Name of the template to remove')
    .action(tokenRemoveHandler);

  return tokenCmd;
};
