import { Command } from 'commander';
import { setupHandler } from '../handlers/setup.js';

export const createSetupCmd = () => {
  const setupCmd = new Command('setup');

  setupCmd
    .description('setup new deployment using recipe')
    .argument('[recipe]', 'Name of the recipe to setup')
    .option('-v, --verbose', 'Verbose mode; will output more information')
    .action(setupHandler);

  return setupCmd;
};
