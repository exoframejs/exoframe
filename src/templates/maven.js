export default {
  name: 'Maven Exoframe Template',
  check: (filesList) => filesList.includes('pom.xml'),
  dockerfile: `
FROM maven:onbuild

CMD mvn exec:java
`,
  ignores: ['.git/', 'release/'],
  labels: {
    'exoframe.type': 'maven',
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
      this.dockerfile = this.dockerfile.replace(/CMD.+?\n/g, `CMD ${cmd}`);
    }
  },
};
