import chalk from 'chalk';

export const handleError = (e) => {
  if (e.statusCode === 403) {
    console.log(chalk.red('Authentication token expired!'), 'Please re-login');
    return true;
  }

  if (e.code === 'ECONNREFUSED') {
    console.log(chalk.red('Could not connect to server!'), 'Try again?');
    return true;
  }

  return false;
};
