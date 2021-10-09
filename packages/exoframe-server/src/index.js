// npm packages
import cors from 'cors';
import { setup as faas } from 'exoframe-faas';
import initFastify from 'fastify';
import fastifyAuth from 'fastify-auth';
import setupAuth from './auth/index.js';
import { faasFolder, getConfig, waitForConfig } from './config/index.js';
import { initDocker } from './docker/init.js';
import logger from './logger/index.js';
import { initPlugins } from './plugins/index.js';
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
      fastify.use(cors());
    } else {
      // otherwise pass config object to cors
      fastify.use(cors(config.cors));
    }
  }

  // add custom parser that just passes stream on
  fastify.addContentTypeParser('*', (req, done) => done());

  // register plugins
  await setupAuth(fastify).register(routes).register(faas({ faasFolder })).ready();

  // start server
  await fastify.listen(port, '0.0.0.0');
  logger.info(`Server running at: ${fastify.server.address().port}`);

  return fastify;
}

// export start function
export async function start(port) {
  // init plugins
  await initPlugins();

  // init required docker service
  await initDocker();

  // init and return server
  return startServer(port);
}
