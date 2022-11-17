import { Command } from 'commander';
import { removeHandler } from '../handlers/remove.js';

export const createRemoveCmd = () => {
  const removeCmd = new Command('remove');

  removeCmd
    .alias('rm')
    .description('remove active deployment')
    .argument('<id>', 'deployment id')
    .option('-t, --token [token]', 'Deployment token to be used for authentication')
    .action(removeHandler);

  return removeCmd;
};
