import { Command } from 'commander';
import { configAuthHandler } from '../handlers/config/auth.js';
import { configHandler } from '../handlers/config/index.js';

const configCmd = new Command('config');

configCmd
  .description('edit or create config file for current project')
  .option('--init', 'Creates new basic config (enables non-interactive mode)')
  .option('-d, --domain [domain]', 'Sets the domain (enables non-interactive mode)')
  .option('--port [port]', 'Sets port (enables non-interactive mode)')
  .option('-p, --project [project]', 'Sets the project name (enables non-interactive mode)')
  .option('-n, --name [name]', 'Sets the name (enables non-interactive mode)')
  .option('-r, --restart [restart]', 'Sets the restart option (enables non-interactive mode)')
  .option('--hostname [hostname]', 'Sets the hostname (enables non-interactive mode)')
  .action(configHandler);

configCmd
  .command('auth')
  .description('add basic authentication')
  .option('-u, --user [user]', 'User for auth entry (enables non-interactive mode)')
  .option('-p, --pass [pass]', 'Password for auth entry (enables non-interactive mode)')
  .action(configAuthHandler);

export default configCmd;
