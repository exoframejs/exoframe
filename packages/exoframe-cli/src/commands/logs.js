import { Command } from 'commander';
import { logsHandler } from '../handlers/logs.js';

export const createLogsCmd = () => {
  const logsCmd = new Command('logs');

  logsCmd
    .alias('log')
    .description('get logs for given deployment')
    .argument('<id>', 'deployment id')
    .option('-f, --follow', 'Follow log output')
    .action(logsHandler);

  return logsCmd;
};
