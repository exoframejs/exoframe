import { Command } from 'commander';
import { loginHandler } from '../handlers/login.js';

export const createLoginCmd = () => {
  const loginCmd = new Command('login');

  loginCmd
    .description('login into exoframe server')
    .option('-k, --key [key]', 'User private key used for authentication')
    .option('-p, --passphrase [passphrase]', 'Passphrase for user private key (if set)')
    .option('-u, --url [url]', 'URL of a new endpoint')
    .action(loginHandler);

  return loginCmd;
};
