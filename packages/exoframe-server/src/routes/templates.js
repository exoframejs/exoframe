import { readFileSync } from 'fs';
import { join } from 'path';
// our modules
import { extensionsFolder } from '../config/index.js';
import { runNPM } from '../util/index.js';

export default (fastify) => {
  fastify.route({
    method: 'GET',
    path: '/templates',
    async handler(request, reply) {
      const packagePath = join(extensionsFolder, 'package.json');
      const packageString = readFileSync(packagePath).toString();
      const packageJSON = JSON.parse(packageString);

      reply.send(packageJSON.dependencies || {});
    },
  });

  fastify.route({
    method: 'POST',
    path: '/templates',
    async handler(request, reply) {
      const { templateName } = request.body;
      const log = await runNPM({ args: ['install', '--verbose', templateName], cwd: extensionsFolder });
      reply.send({ success: !log.find((it) => it.level === 'error'), log });
    },
  });

  fastify.route({
    method: 'DELETE',
    path: '/templates',
    async handler(request, reply) {
      // get template that needs to be removed
      const { templateName } = request.body;

      // get list of installed templates
      const packagePath = join(extensionsFolder, 'package.json');
      const packageString = readFileSync(packagePath).toString();
      const packageJSON = JSON.parse(packageString);

      const existingTemplate = Object.keys(packageJSON.dependencies).includes(templateName);
      if (!existingTemplate) {
        reply.send({ removed: false, log: ['Template does not exist'] });
        return;
      }
      // remove token from collection
      const log = await runNPM({ args: ['remove', '--verbose', templateName], cwd: extensionsFolder });
      // send back to user
      reply.send({ removed: !log.find((it) => it.level === 'error'), log });
    },
  });
};
