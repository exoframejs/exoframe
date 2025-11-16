/* eslint no-await-in-loop: off */
import { randomUUID } from 'crypto';
import _ from 'highland';
import { getConfig } from '../config/index.js';
import { tempDockerDir } from '../config/paths.js';
import { build } from '../docker/build.js';
import { scheduleCleanup, schedulePrune } from '../docker/cleanup.js';
import docker from '../docker/docker.js';
import { start } from '../docker/start.js';
import getTemplates from '../docker/templates/index.js';
import { pullImage } from '../docker/util.js';
import logger from '../logger/index.js';
import * as util from '../util/index.js';

// destruct locally used functions
const { cleanTemp, unpack, getProjectConfig, projectFromConfig } = util;

// deployment from unpacked files
const deploy = async ({ username, folder, existing, resultStream }) => {
  let template;
  // try getting template from config
  const config = getProjectConfig(folder);
  // get server config
  const serverConfig = getConfig();

  // generate template props
  const templateProps = {
    config,
    serverConfig: { ...serverConfig },
    existing,
    username,
    resultStream,
    tempDockerDir,
    folder,
    docker: {
      daemon: docker,
      build,
      start,
      pullImage,
    },
    util: Object.assign({}, util, {
      logger,
    }),
  };

  // get templates
  const templates = await getTemplates();

  // match via config if possible
  if (config.template && config.template.length > 0) {
    logger.debug('Looking up template from config:', config.template);
    template = templates.find((t) => t.name === config.template);
  } else {
    // find template using check logic
    for (let i = 0; i < templates.length; i++) {
      const t = templates[i];
      const isRightTemplate = await t.checkTemplate(templateProps);
      if (isRightTemplate) {
        template = t;
        break;
      }
    }
  }

  // if template not found - throw an error
  if (!template) {
    logger.debug(`Build failed! Couldn't find template: ${config.template}`);
    util.writeStatus(resultStream, {
      message: `Build failed! Couldn't find template: ${config.template}!`,
      level: 'error',
    });
    resultStream.end('');
    return;
  }

  logger.debug('Using template:', template);
  // execute fitting template
  await template.executeTemplate(templateProps);
};

export default (fastify) => {
  fastify.route({
    method: 'POST',
    path: '/deploy',
    async handler(request, reply) {
      // get username
      const { username } = request.user;
      // get stream
      const tarStream = request.raw;
      // create new deploy folder for user
      const folder = `${username}-${randomUUID()}`;
      // unpack to user specific temp folder
      await unpack({ tarStream, folder });
      // create new highland stream for results
      const resultStream = _();
      // run deploy
      deploy({ username, folder, resultStream }).then(() => schedulePrune());
      // reply with deploy stream
      const responseStream = resultStream.toNodeStream();
      // schedule temp folder cleanup on end
      responseStream.on('end', () => cleanTemp(folder));
      return reply.code(200).send(responseStream);
    },
  });

  fastify.route({
    method: 'POST',
    path: '/update',
    async handler(request, reply) {
      // get username
      const { username } = request.user;
      // get stream
      const tarStream = request.raw;
      // create new deploy folder for user
      const folder = `${username}-${randomUUID()}`;
      // unpack to temp user folder
      await unpack({ tarStream, folder });
      // get old project containers if present
      // get project config and name
      const config = getProjectConfig(folder);
      const project = projectFromConfig({ username, config });

      // get all current containers
      const oldContainers = await docker.listContainers({ all: true });
      // find containers for current user and project
      const existing = oldContainers.filter(
        (c) => c.Labels['exoframe.user'] === username && c.Labels['exoframe.project'] === project
      );

      // create new highland stream for results
      const resultStream = _();
      // deploy new versions
      deploy({ username, folder, payload: request.payload, resultStream });
      // reply with deploy stream
      const responseStream = resultStream.toNodeStream();
      // schedule temp folder and container cleanup on deployment end
      responseStream.on('end', () => {
        // schedule container cleanup
        scheduleCleanup({ username, project, existing });
        // clean temp folder
        cleanTemp(folder);
      });
      return reply.code(200).send(responseStream);
    },
  });
};
