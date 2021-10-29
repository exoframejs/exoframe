import pino from 'pino';

// prepare level
const levelTesting = process.env.NODE_ENV === 'testing' ? 'error' : false;
const level = levelTesting || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug');

// use pino-pretty in debug mode
const transport =
  process.env.NODE_ENV === 'production'
    ? {}
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      };

const logger = pino({
  name: 'exoframe-server',
  level,
  transport,
});

export default logger;
