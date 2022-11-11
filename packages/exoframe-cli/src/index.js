import { Command } from 'commander';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createConfigCmd } from './commands/config.js';
import { createDeployCmd } from './commands/deploy.js';
import { createEndpointCmd } from './commands/endpoint.js';
import { createLoginCmd } from './commands/login.js';

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

  //   .help()
  //   .command(deploy)
  //   .command(endpointRm)
  //   .command(list)
  //   .command(logs)
  //   .command(remove)
  //   .command(token)
  //   .command(update)
  //   .command(template)
  //   .command(setup)
  //   .command(secrets)
  //   .command(system)
  //   .command(completion(yargs)).argv;

  return program;
};
