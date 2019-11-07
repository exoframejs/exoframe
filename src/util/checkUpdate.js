// npm packages
const chalk = require('chalk');
const latestVersion = require('latest-version');
const semverDiff = require('semver-diff');

// packaged script path
const pkgPath = '/snapshot/exoframe-cli/src/util';

// check function
module.exports = async pkg => {
  const current = '5.0.0'; // pkg.version;
  // Checks for available update and returns an instance
  const latest = await latestVersion('exoframe').then(r => r.trim());
  // show message if update is available
  if (semverDiff(current, latest)) {
    const isPackaged = __dirname === pkgPath;
    const upNpmMsg = `Run ${chalk.cyan('npm i -g exoframe')} to update`;
    const upPkgMsg = `Download from ${chalk.cyan('https://github.com/exoframejs/exoframe/releases')}`;
    const upmsg = isPackaged ? upPkgMsg : upNpmMsg;
    const message = `Update available ${chalk.dim(current)} ${chalk.reset('→')} ${chalk.green(latest)}`;
    console.log(`
  ┌───────────────────────────────────────┐
  │                                       │
  │     ${message}    │
  │    ${upmsg}    │
  │                                       │
  └───────────────────────────────────────┘
  `);
  }
};
