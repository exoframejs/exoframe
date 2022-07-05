import { Command } from 'commander';
import { endpointAddHandler, endpointRmHandler, endpointSwitchHandler } from '../handlers/endpoint.js';

const endpointCmd = new Command('endpoint').description('manage exoframe server URL');

endpointCmd
  .command('switch', null, { isDefault: true })
  .description('switch current endpoint')
  .argument('[url]', 'URL of a new endpoint')
  .action(endpointSwitchHandler);

endpointCmd
  .command('add')
  .description('add new endpoint')
  .argument('[url]', 'URL of a new endpoint')
  .action(endpointAddHandler);

endpointCmd
  .command('remove')
  .description('remove endpoint from config')
  .alias('rm')
  .argument('[url]', 'URL of a new endpoint')
  .action(endpointRmHandler);

export default endpointCmd;
