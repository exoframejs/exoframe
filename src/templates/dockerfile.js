export default {
  name: 'Dockerfile Exoframe Template',
  check: (filesList) => filesList.includes('Dockerfile'),
  dockerfile: 'I will not be used',
  ignores: ['.git/'],
  labels: {
    'exoframe.type': 'user-dockerfile',
  },
};
