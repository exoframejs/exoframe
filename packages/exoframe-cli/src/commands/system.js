import { Command } from 'commander';
import { systemPruneHandler } from '../handlers/system/prune.js';

export const createSystemCmd = () => {
  const systemCmd = new Command('system').description('execute system commands');

  systemCmd
    .command('prune')
    .description('Remove unused data from docker (docker system prune)')
    .action(systemPruneHandler);

  return systemCmd;
};
