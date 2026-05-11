import { Command } from 'commander';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createConfigCmd } from './commands/config.ts';
import { createDeployCmd } from './commands/deploy.ts';
import { createEndpointCmd } from './commands/endpoint.ts';
import { createListCmd } from './commands/list.ts';
import { createLoginCmd } from './commands/login.ts';
import { createLogsCmd } from './commands/logs.ts';
import { createRemoveCmd } from './commands/remove.ts';
import { createSecretsCmd } from './commands/secrets.ts';
import { createSetupCmd } from './commands/setup.ts';
import { createSystemCmd } from './commands/system.ts';
import { createTemplateCmd } from './commands/template.ts';
import { createTokenCmd } from './commands/token.ts';
import { createUpdateCmd } from './commands/update.ts';

const baseFolder = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse((await readFile(path.join(baseFolder, '..', 'package.json'))).toString());

// import checkUpdate from './util/checkUpdate';
// check for updates on start
// checkUpdate(pkg);

export const createProgram = () => {
  // init program
  const program = new Command();

  // set version
  program.version(pkg.version);

  // add commands
  program.addCommand(createConfigCmd());
  program.addCommand(createDeployCmd());
  program.addCommand(createEndpointCmd());
  program.addCommand(createLoginCmd());
  program.addCommand(createListCmd());
  program.addCommand(createLogsCmd());
  program.addCommand(createRemoveCmd());
  program.addCommand(createSecretsCmd());
  program.addCommand(createSetupCmd());
  program.addCommand(createSystemCmd());
  program.addCommand(createTemplateCmd());
  program.addCommand(createTokenCmd());
  program.addCommand(createUpdateCmd());

  return program;
};
