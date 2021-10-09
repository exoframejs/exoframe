/* eslint-env jest */
const plugin = {
  config: {
    name: 'test',
    exclusive: true,
  },
  // functions
  init: jest.fn(() => true),
  start: jest.fn(() => true),
  startFromParams: jest.fn(() => true),
  list: jest.fn(() => true),
  logs: jest.fn(({ reply }) => reply.status(200).send({})),
  remove: jest.fn(({ reply }) => reply.status(200).send({})),
  // template extensions
  compose: jest.fn(() => true),
};

export default plugin;
