// npm packages
import fastifyAuth from '@fastify/auth';
import cors from '@fastify/cors';
import initFastify from 'fastify';
import setupAuth from './auth/index.ts';
import { getConfig, waitForConfig } from './config/index.ts';
import { initDocker } from './docker/init.ts';
import logger from './logger/index.ts';
import routes from './routes/index.ts';

export async function startServer(port = 8080) {
  // create server
  const fastify = initFastify().register(fastifyAuth);

  // enable cors if needed
  await waitForConfig();
  const config = getConfig();
  if (config.cors) {
    logger.warn(`cors is enabled with config: ${JSON.stringify(config.cors)}`);
    // if it's just true - simply enable it
    if (typeof config.cors === 'boolean') {
      fastify.register(cors);
    } else {
      // otherwise pass config object to cors
      fastify.register(cors, config.cors);
    }
  }

  // add custom parser that just passes stream on
  fastify.addContentTypeParser('*', (_request, _payload, done) => done(null));

  // register plugins
  await setupAuth(fastify).register(routes).ready();

  // tests use fastify.inject() and do not need a real socket listener
  if (process.env.NODE_ENV === 'testing') {
    return fastify;
  }

  // start server
  await fastify.listen({ port, host: '0.0.0.0' });
  logger.info(`Server running at: 0.0.0.0:${port}`);

  return fastify;
}

// export start function
export async function start(port = 8080) {
  // init required docker service
  await initDocker();

  // init and return server
  return startServer(port);
}
