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
};
