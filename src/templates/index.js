// npm packages
import fs from 'fs';
import chalk from 'chalk';

// our packages
import config from '../config';

export default (workdir) => {
  const templatePlugins = config.plugins ? config.plugins.templates || [] : [];
  const templates = [].concat(templatePlugins
    .map(plugin => {
      const name = typeof plugin === 'object' ? Object.keys(plugin)[0] : plugin;
      return require(name); // eslint-disable-line
    })
  );

  // get files
  const files = fs.readdirSync(workdir);

  for (let i = 0; i < templates.length; i++) {
    const t = templates[i];
    if (t.check(files, workdir)) {
      console.log(chalk.green('Using template:'), t.name);
      return t;
    }
  }

  return null;
};
