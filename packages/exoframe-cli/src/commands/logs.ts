import { Command } from 'commander';
import { logsHandler } from '../handlers/logs.ts';

export const createLogsCmd = () => {
  const logsCmd = new Command('logs');

  logsCmd
    .alias('log')
    .description('get logs for given deployment')
    .argument('<id>', 'deployment id')
    .option('-f, --follow', 'Follow log output')
    .option('-t, --tail <lines>', 'Number of lines to show from the end of the logs')
    .option('--since <date>', 'Only return logs after this date')
    .option('--until <date>', 'Only return logs before this date')
    .action(logsHandler);

  return logsCmd;
};
