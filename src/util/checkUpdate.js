// npm packages
const chalk = require('chalk');
const boxen = require('boxen');
const updateNotifier = require('update-notifier');

// boxen options
const boxenOpts = {
  padding: 1,
  margin: 1,
  align: 'center',
  borderColor: 'yellow',
  borderStyle: 'round',
};
// packaged script path
const pkgPath = '/snapshot/exoframe-cli/src/util';

// check function
module.exports = pkg => {
  // Checks for available update and returns an instance
  const notifier = updateNotifier({
    pkg,
    updateCheckInterval: 1000,
  });
  // show message if update is available
  if (notifier.update) {
    const {update} = notifier;
    const isPackaged = __dirname === pkgPath;
    const upNpmMsg = `Run ${chalk.cyan('npm i -g exoframe')} to update`;
    const upPkgMsg = `Download from ${chalk.cyan('https://github.com/exoframejs/exoframe/releases')}`;
    const upmsg = isPackaged ? upPkgMsg : upNpmMsg;
    const message = `Update available ${chalk.dim(update.current)} ${chalk.reset(' → ')} ${chalk.green(
      update.latest
    )}\n${upmsg}`;
    console.log(`\n${boxen(message, boxenOpts)}`);
  }
};
