import commander from 'commander';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './commands/config.js';
import login from './commands/login.js';

const baseFolder = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse((await readFile(path.join(baseFolder, '..', 'package.json'))).toString());

// import checkUpdate from './util/checkUpdate';
// check for updates on start
// checkUpdate(pkg);

// init program
const program = new commander.Command();

// set version
program.version(pkg.version);

// add commands
program.addCommand(login);
program.addCommand(config);

// version(pkg.version)
//   .demand(1)
//   .help()
//   .command(deploy)
//   .command(login)
//   .command(endpoint)
//   .command(endpointRm)
//   .command(list)
//   .command(logs)
//   .command(remove)
//   .command(token)
//   .command(config)
//   .command(update)
//   .command(template)
//   .command(setup)
//   .command(secrets)
//   .command(system)
//   .command(completion(yargs)).argv;

export default program;
