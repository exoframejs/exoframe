import commander from 'commander';
import { render } from 'ink';
import React from 'react';
import Login from '../components/login/index.js';
// import { handler as endpointHandler } from './endpoint';

const loginCmd = new commander.Command('login');

loginCmd
  .description('login into exoframe server')
  .option('-k, --key [key]', 'User private key used for authentication')
  .option('-p, --passphrase [passphrase]', 'Passphrase for user private key (if set)')
  .option('-u, --url [url]', 'URL of a new endpoint')
  .action(({ key, passphrase, url }) => {
    render(<Login keyPath={key} passphrase={passphrase} url={url} />);
  });

export default loginCmd;
