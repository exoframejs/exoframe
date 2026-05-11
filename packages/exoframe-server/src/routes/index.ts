import deploy from './deploy.ts';
import list from './list.ts';
import logs from './logs.ts';
import remove from './remove.ts';
import secrets from './secrets.ts';
import setup from './setup.ts';
import system from './system.ts';
import templates from './templates.ts';
import update from './update.ts';
import version from './version.ts';

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
