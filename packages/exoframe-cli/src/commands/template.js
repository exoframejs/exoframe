import { Command } from 'commander';
import { templateAddHandler } from '../handlers/template/add.js';
import { templateListHandler } from '../handlers/template/list.js';
import { templateRemoveHandler } from '../handlers/template/remove.js';

export const createTemplateCmd = () => {
  const templateCmd = new Command('template').description('manage deployment templates');

  templateCmd
    .command('list')
    .alias('ls')
    .description('List currently installed deployment templates')
    .action(templateListHandler);

  templateCmd
    .command('add')
    .description('Install new deployment template')
    .argument('[name]', 'Name of the template to install')
    .option('-v, --verbose', 'Verbose mode; will output more information')
    .action(templateAddHandler);

  templateCmd
    .command('remove')
    .alias('rm')
    .description('Remove deployment template')
    .argument('[name]', 'Name of the template to remove')
    .option('-v, --verbose', 'Verbose mode; will output more information')
    .action(templateRemoveHandler);

  return templateCmd;
};
