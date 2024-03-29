import { Command } from 'commander';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createConfigCmd } from './commands/config.js';
import { createDeployCmd } from './commands/deploy.js';
import { createEndpointCmd } from './commands/endpoint.js';
import { createListCmd } from './commands/list.js';
import { createLoginCmd } from './commands/login.js';
import { createLogsCmd } from './commands/logs.js';
import { createRemoveCmd } from './commands/remove.js';
import { createSecretsCmd } from './commands/secrets.js';
import { createSetupCmd } from './commands/setup.js';
import { createSystemCmd } from './commands/system.js';
import { createTemplateCmd } from './commands/template.js';
import { createTokenCmd } from './commands/token.js';
import { createUpdateCmd } from './commands/update.js';

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
