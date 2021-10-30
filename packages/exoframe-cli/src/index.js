import commander from 'commander';
import pkg from '../package.json';
import login from './commands/login.js';

// import checkUpdate from './util/checkUpdate';
// check for updates on start
// checkUpdate(pkg);

// init program
const program = new commander.Command();

// set version
program.version(pkg.version);

// add commands
program.addCommand(login);

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

program.parse(process.argv);
