// npm packages
const chalk = require('chalk');
const updateNotifier = require('update-notifier');

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
    const message = `Update available ${chalk.dim(update.current)} ${chalk.reset('→')} ${chalk.green(update.latest)}`;
    console.log(`
  ┌───────────────────────────────────────┐
  │                                       │
  │        ${message}       │
  │    ${upmsg}    │
  │                                       │
  └───────────────────────────────────────┘
  `);
  }
};
