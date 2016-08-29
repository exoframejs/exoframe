// npm packages
import fs from 'fs';
import chalk from 'chalk';

// our packages
import nodeTemplate from './node';
import mavenTemplate from './maven';

export default (workdir) => {
  const templates = [nodeTemplate, mavenTemplate];

  // get files
  const files = fs.readdirSync(workdir);

  let dockerfile;
  let ignores;
  let labels;
  for (let i = 0; i < templates.length; i++) {
    const t = templates[i];
    if (t.check(files, workdir)) {
      console.log(chalk.green('Using template:'), t.name);
      dockerfile = t.dockerfile;
      ignores = t.ignores || [];
      labels = t.labels || {};
    }
  }

  return {dockerfile, ignores, labels};
};
