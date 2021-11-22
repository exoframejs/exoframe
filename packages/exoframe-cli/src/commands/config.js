import commander from 'commander';
import { render } from 'ink';
import React from 'react';
import Config from '../components/config/index.js';

const configCmd = new commander.Command('config');

configCmd
  .alias('init')
  .description('edit or create config file for current project')
  .option('-d, --domain [domain]', 'Sets the domain (enables non-interactive mode)')
  .option('--port [port]', 'Sets port (enables non-interactive mode)')
  .option('-p, --project [project]', 'Sets the project name (enables non-interactive mode)')
  .option('-n, --name [name]', 'Sets the name (enables non-interactive mode)')
  .option('-r, --restart [restart]', 'Sets the restart option (enables non-interactive mode)')
  .option('--hostname [hostname]', 'Sets the hostname (enables non-interactive mode)')
  .action(({ domain, port, project, name, restart, hostname }) => {
    render(<Config domain={domain} port={port} project={project} name={name} restart={restart} hostname={hostname} />);
  });

export default configCmd;
