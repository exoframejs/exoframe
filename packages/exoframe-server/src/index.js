// npm packages
import initFastify from 'fastify';
import fastifyAuth from 'fastify-auth';
import cors from 'fastify-cors';
import setupAuth from './auth/index.js';
import { getConfig, waitForConfig } from './config/index.js';
import { initDocker } from './docker/init.js';
import logger from './logger/index.js';
import routes from './routes/index.js';

export async function startServer(port = 8080) {
  // create server
  const fastify = initFastify().register(fastifyAuth);

  // enable cors if needed
  await waitForConfig();
  const config = getConfig();
  if (config.cors) {
    logger.warn('cors is enabled with config:', config.cors);
    // if it's just true - simply enable it
    if (typeof config.cors === 'boolean') {
      fastify.register(cors);
    } else {
      // otherwise pass config object to cors
      fastify.register(cors, config.cors);
    }
  }

  // add custom parser that just passes stream on
  fastify.addContentTypeParser('*', (_request, _payload, done) => done());

  // register plugins
  await setupAuth(fastify).register(routes).ready();

  // start server
  await fastify.listen(port, '0.0.0.0');
  logger.info(`Server running at: ${fastify.server.address().port}`);

  return fastify;
}

// export start function
export async function start(port) {
  // init required docker service
  await initDocker();

  // init and return server
  return startServer(port);
}
