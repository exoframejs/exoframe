import pino from 'pino';

// prepare level
const levelTesting = process.env.NODE_ENV === 'testing' ? 'error' : false;
const level = levelTesting || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug');

const logger = pino({
  name: 'exoframe-server',
  level,
  prettyPrint: process.env.NODE_ENV !== 'production',
});

export default logger;
