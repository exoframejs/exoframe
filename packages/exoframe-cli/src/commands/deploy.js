import { Command } from 'commander';
import { deployProject } from '../handlers/deploy.js';

export const createDeployCmd = () => {
  const deployCmd = new Command('deploy')
    .description('deploy folder to remote server')
    .argument('[folder]', 'project folder')
    .option('-c, --config [config]', 'Configuration file to be used for deployment')
    .option('-e, --endpoint [endpoint]', 'Exoframe server endpoint to use (will override config value)')
    .option('-t, --token [token]', 'Deployment token to be used for authentication')
    .option('-u, --update', 'Update current project instead of simple deployment')
    .option('-o, --open', 'Open deployed project in browser after upload')
    .option('-v, --verbose', 'Verbose mode; will output more information', (_, prev) => prev + 1, 0)
    .action(deployProject);

  return deployCmd;
};
