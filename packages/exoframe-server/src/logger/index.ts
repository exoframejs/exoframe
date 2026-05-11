import { join } from 'path';
import pino from 'pino';
import { logFolder } from '../config/paths.ts';

// prepare level
const levelTesting = process.env.NODE_ENV === 'testing' ? 'error' : false;
const level = levelTesting || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug');

// use pino-pretty in debug mode
const transport =
  process.env.NODE_ENV === 'production'
    ? pino.transport({
        target: 'pino/file',
        options: { destination: join(logFolder, 'log.txt'), append: true },
      })
    : pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      });

const logger = pino(
  {
    name: 'exoframe-server',
    level,
  },
  transport
);

export default logger;
