// images
const ghostImage = 'ghost:latest';

export const getQuestions = () => [
  {
    type: 'input',
    name: 'projectName',
    message: 'Ghost project name:',
  },
  {
    type: 'input',
    name: 'ghostDomain',
    message: 'Domain for Ghost:',
  },
];

const startGhost = async ({ util, answers, serverConfig, username, docker, volume }) => {
  const deploymentName = util.nameFromImage(ghostImage);

  return docker.startFromParams({
    image: ghostImage,
    projectName: answers.projectName,
    username,
    deploymentName,
    frontend: `Host:${answers.ghostDomain}`,
    restartPolicy: 'always',
    Env: [`url=http${serverConfig.letsencrypt ? 's' : ''}://${answers.ghostDomain}`],
    Mounts: [
      {
        Type: 'volume',
        Source: volume.name,
        Target: '/var/lib/ghost/content',
      },
    ],
  });
};

export const runSetup = async ({ answers, serverConfig, username, docker, util }) => {
  // init log
  const log = [];

  const ghostVolumeName = answers.projectName.toLowerCase().replace(/\s/g, '-');

  try {
    util.logger.debug('starting work..');
    // create new volume for ghost data
    const ghostVolume = await docker.daemon.createVolume({ Name: ghostVolumeName });
    util.logger.debug(ghostVolume);
    // pull latest image
    await docker.pullImage(ghostImage);
    // start ghost container
    util.logger.debug('starting ghost..');
    const ghost = await startGhost({ util, answers, serverConfig, username, docker, volume: ghostVolume });
    log.push({ message: 'Ghost container started', data: ghost, level: 'info' });
    util.logger.debug('created ghost container..');
  } catch (e) {
    util.logger.error('error:', e);
    log.push({ message: e.toString(), data: e, level: 'error' });
  }

  return log;
};
