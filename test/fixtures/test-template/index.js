module.exports = {
  name: 'Test Exoframe Template',
  check: (filesList) => filesList.includes('test.file'),
  dockerfile: `
FROM busybox

RUN mkdir /test
WORKDIR /test
COPY . /test
`,
  ignores: ['.git/'],
  labels: {
    'exoframe.type': 'test',
  },
};
