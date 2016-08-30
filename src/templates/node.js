export default {
  name: 'Node.js Exoframe Template',
  check: (filesList) => filesList.includes('package.json') && filesList.includes('node_modules'),
  dockerfile: 'FROM node:onbuild',
  ignores: ['.git/', 'node_modules/'],
  labels: {
    'exoframe.type': 'node.js',
  },
  async interactive(inquirer) {
    const prompts = [];
    prompts.push({
      type: 'input',
      name: 'cmd',
      message: 'New command:',
    });

    const {cmd} = await inquirer.prompt(prompts);
    if (cmd) {
      this.dockerfile = `${this.dockerfile}

CMD ${cmd}`;
    }
  },
};
