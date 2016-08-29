export default {
  name: 'Node.js Exoframe Template',
  check: (filesList) => filesList.includes('package.json') && filesList.includes('node_modules'),
  dockerfile: 'FROM node:onbuild',
  ignores: ['.git/', 'node_modules/'],
  labels: {
    'exoframe.type': 'node.js',
  },
};
