import { Command } from 'commander';
import { updateHandler } from '../handlers/update.ts';

export const createUpdateCmd = () => {
  const tokenCmd = new Command('update')
    .description('check for updates or update given target')
    .argument('[target]', 'Target for update (all, server, traefik)')
    .action(updateHandler);

  return tokenCmd;
};
