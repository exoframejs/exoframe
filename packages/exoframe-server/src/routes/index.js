import deploy from './deploy.js';
import list from './list.js';
import logs from './logs.js';
import remove from './remove.js';
import secrets from './secrets.js';
import setup from './setup.js';
import system from './system.js';
import templates from './templates.js';
import update from './update.js';
import version from './version.js';

export default (fastify, opts, next) => {
  // enable auth for all routes
  fastify.addHook('preHandler', fastify.auth([fastify.verifyJWT]));

  deploy(fastify);
  list(fastify);
  remove(fastify);
  logs(fastify);
  update(fastify);
  version(fastify);
  templates(fastify);
  setup(fastify);
  secrets(fastify);
  system(fastify);

  next();
};
