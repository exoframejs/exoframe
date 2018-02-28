// npm packages
const os = require('os');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const chalk = require('chalk');

// construct paths
const baseFolder = path.join(os.homedir(), '.exoframe');
const configPath = path.join(baseFolder, 'cli.config.yml');

const defaultConfig = {
  endpoint: 'http://localhost:8080',
};

// default config
let userConfig = defaultConfig;

// create config folder if doesn't exist
try {
  fs.statSync(baseFolder);
} catch (e) {
  fs.mkdirSync(baseFolder);
}

// create user config if doesn't exist
try {
  fs.statSync(configPath);
} catch (e) {
  fs.writeFileSync(configPath, yaml.safeDump(defaultConfig), 'utf8');
}

// load
try {
  const newCfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
  // assign new config and clean endpoint url
  userConfig = Object.assign(newCfg, {
    endpoint: newCfg.endpoint.replace(/\/$/, ''),
  });
} catch (e) {
  console.error('Error parsing user config:', e);
}

exports.updateConfig = newCfg => {
  const cfg = Object.assign(userConfig, newCfg);
  fs.writeFileSync(configPath, yaml.safeDump(cfg), 'utf8');
};

exports.isLoggedIn = () => {
  if (!userConfig.user || !userConfig.user.username) {
    console.log(chalk.red('Error: not logged in!'), 'Please, login first!');
    return false;
  }

  return true;
};

exports.logout = cfg => {
  delete cfg.user;
  delete cfg.token;
  exports.updateConfig(cfg);
};

// latest config from file
exports.userConfig = userConfig;
