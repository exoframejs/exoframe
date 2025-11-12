// npm packages
import { readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const nginxDockerfile = `FROM nginx:latest
COPY . /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html
`;

export const name = 'static';

// function to check if the template fits this recipe
export async function checkTemplate({ tempDockerDir, folder }) {
  // if project already has dockerfile - just exit
  try {
    const filesList = readdirSync(join(tempDockerDir, folder));
    if (filesList.includes('index.html')) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// function to execute current template
export async function executeTemplate({ username, tempDockerDir, folder, resultStream, util, docker, existing }) {
  try {
    // generate dockerfile
    const dockerfile = nginxDockerfile;
    const dfPath = join(tempDockerDir, folder, 'Dockerfile');
    writeFileSync(dfPath, dockerfile, 'utf-8');
    util.writeStatus(resultStream, { message: 'Deploying Static HTML project..', level: 'info' });

    // build docker image
    const buildRes = await docker.build({ username, folder, resultStream });
    util.logger.debug('Build result:', buildRes);

    // start image
    const container = await docker.start(Object.assign({}, buildRes, { username, folder, existing, resultStream }));
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
