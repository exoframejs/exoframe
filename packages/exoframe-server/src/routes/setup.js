/* eslint global-require: off */
/* eslint import/no-dynamic-require: off */
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { getConfig, recipesFolder, tempDockerDir } from '../config/index.js';
import { build, buildFromParams } from '../docker/build.js';
import docker from '../docker/docker.js';
import { createNetwork, initNetwork as getNetwork } from '../docker/network.js';
import { start, startFromParams } from '../docker/start.js';
import { pullImage } from '../docker/util.js';
import logger from '../logger/index.js';
import * as util from '../util/index.js';

export default (fastify) => {
  fastify.route({
    method: 'GET',
    path: '/setup',
    async handler(request, reply) {
      const { recipeName } = request.query;
      logger.debug('setting up:', recipeName);
      // install recipe
      const log = await util.runNPM({ args: ['install', '--verbose', recipeName], cwd: recipesFolder });
      const success = !log.find((it) => it.level === 'error');
      // if log contains errors - just terminate now
      if (!success) {
        reply.send({ success, log });
        return;
      }
      // get installed recipe path
      const recipePath = join(recipesFolder, 'node_modules', recipeName);
      // load recipe
      const recipe = await import(recipePath);
      // get questions
      const questions = recipe.getQuestions();
      reply.send({ success, log, questions });
    },
  });

  fastify.route({
    method: 'POST',
    path: '/setup',
    async handler(request, reply) {
      // get username
      const { username } = request.user;
      // get server config
      const serverConfig = getConfig();
      // get user vars
      const { recipeName, answers } = request.body;
      logger.debug('executing recipe:', recipeName);
      // get installed recipe path
      const recipePath = join(recipesFolder, 'node_modules', recipeName);
      // create new deploy folder for user
      const folder = `${username}-${randomUUID()}`;
      mkdirSync(join(tempDockerDir, folder));
      // load recipe with update parameter to force reload
      const recipe = await import(`${recipePath}?update=${Date.now()}`);
      // generate recipe props
      const recipeProps = {
        // user answers
        answers,
        // our vars
        serverConfig,
        username,
        tempDockerDir,
        folder,
        docker: {
          daemon: docker,
          build,
          buildFromParams,
          start,
          startFromParams,
          pullImage,
          getNetwork,
          createNetwork,
        },
        util: Object.assign({}, util, {
          logger,
        }),
      };
      // wait for recipe execution
      try {
        const log = await recipe.runSetup(recipeProps);
        const success = !log.find((it) => it.level === 'error');
        reply.send({ success, log });
      } catch (e) {
        reply.send({ success: false, log: [{ message: e.toString(), level: 'error' }] });
      }
    },
  });
};
