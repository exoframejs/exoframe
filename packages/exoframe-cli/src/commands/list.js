import { Command } from 'commander';
import { listHandler } from '../handlers/list.js';

export const createListCmd = () => {
  const listCmd = new Command('list');

  listCmd.description('list current active deployments').alias('ls').action(listHandler);

  return listCmd;
};
