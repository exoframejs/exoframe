// npm packages
import { createReadStream } from 'fs';
import { join } from 'path';

export const name = 'image';

// function to check if the template fits this recipe
export async function checkTemplate({ config }) {
  // if project has image field defined in config
  try {
    return config.image && config.image.length;
  } catch {
    return false;
  }
}

// function to execute current template
export async function executeTemplate({ config, username, tempDockerDir, folder, resultStream, util, docker }) {
  // build docker image
  try {
    const { image, imageFile } = config;
    const imageName = image.includes(':') ? image : `${image}:latest`;
    util.writeStatus(resultStream, { message: `Deploying project from image: ${imageName}..`, level: 'info' });

    // import from tar if needed
    if (imageFile && imageFile.length) {
      util.writeStatus(resultStream, { message: `Importing image from file: ${imageFile}..`, level: 'info' });
      // get packed stream
      const tarStream = createReadStream(join(tempDockerDir, folder, imageFile));
      const importRes = await docker.daemon.loadImage(tarStream, { tag: imageName });
      util.logger.debug('Import result:', importRes);
    } else {
      // otherwise - pull given image to ensure it exists
      util.writeStatus(resultStream, { message: `Pulling image: ${imageName}..`, level: 'info' });
      const pullRes = await docker.pullImage(imageName);
      util.logger.debug('Pull result:', pullRes);
    }

    // start image
    const container = await docker.start({ image, username, folder, resultStream });
    util.logger.debug(container);

    // return new deployments
    util.writeStatus(resultStream, { message: 'Deployment success!', deployments: [container], level: 'info' });
    resultStream.end('');
  } catch (e) {
    util.logger.debug('build failed!', e);
    util.writeStatus(resultStream, { message: e.error, error: e.error, log: e.log, level: 'error' });
    resultStream.end('');
  }
}
