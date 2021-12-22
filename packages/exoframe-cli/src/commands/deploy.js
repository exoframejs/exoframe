import commander from 'commander';
import { render } from 'ink';
import React from 'react';
import Deploy from '../components/deploy/index.js';
// import { handler as endpointHandler } from './endpoint';

const deployCmd = new commander.Command('deploy [folder]');

deployCmd
  .description('deploy folder to remote server')
  .option('-c, --config [config]', 'Configuration file to be used for deployment')
  .option('-e, --endpoint [endpoint]', 'Exoframe server endpoint to use (will override config value)')
  .option('-t, --token [token]', 'Deployment token to be used for authentication')
  .option('-u, --update', 'Update current project instead of simple deployment')
  .option('-o, --open', 'Open deployed project in browser after upload')
  .option('-v, --verbose', 'Verbose mode; will output more information', (_, prev) => prev + 1, 0)
  .action(({ folder, config, endpoint, token, update, open, verbose }) => {
    render(
      <Deploy
        folder={folder}
        config={config}
        endpoint={endpoint}
        token={token}
        update={update}
        open={open}
        verbose={verbose}
      />
    );
  });

export default deployCmd;
