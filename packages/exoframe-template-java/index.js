// npm packages
import { readdir, writeFile } from 'fs/promises';
import { join } from 'path';

const javaDockerfile = () =>
  `FROM openjdk
COPY . /usr/src/myapp
WORKDIR /usr/src/myapp
EXPOSE 80
CMD java -jar app.jar`;

export const name = 'java';

// function to check if the template fits this recipe
export async function checkTemplate({ tempDockerDir }) {
  // if project already has dockerfile - just exit
  try {
    const filesList = await readdir(tempDockerDir);
    return filesList.filter((file) => file.includes('.jar')).length > 0;
  } catch (e) {
    return false;
  }
}

// function to execute current template
export async function executeTemplate({ username, tempDockerDir, resultStream, util, docker }) {
  try {
    // generate dockerfile
    const dockerfile = javaDockerfile();
    const dfPath = join(tempDockerDir, 'Dockerfile');
    await writeFile(dfPath, dockerfile, 'utf-8');
    util.writeStatus(resultStream, { message: 'Deploying Java project..', level: 'info' });

    // build docker image
    const buildRes = await docker.build({ username, resultStream });
    util.logger.debug('Build result:', buildRes);

    // check for errors in build log
    if (
      buildRes.log
        .map((it) => it.toLowerCase())
        .some((it) => it.includes('error') || (it.includes('failed') && !it.includes('optional')))
    ) {
      util.logger.debug('Build log conains error!');
      util.writeStatus(resultStream, { message: 'Build log contains errors!', level: 'error' });
      resultStream.end('');
      return;
    }

    // start image
    const containerInfo = await docker.start(Object.assign({}, buildRes, { username, resultStream }));
    util.logger.debug(containerInfo.Name);

    // clean temp folder
    await util.cleanTemp();

    const containerData = docker.daemon.getContainer(containerInfo.Id);
    const container = await containerData.inspect();
    // return new deployments
    util.writeStatus(resultStream, { message: 'Deployment success!', deployments: [container], level: 'info' });
    resultStream.end('');
  } catch (e) {
    util.logger.debug('build failed!', e);
    util.writeStatus(resultStream, { message: e.error, error: e.error, log: e.log, level: 'error' });
    resultStream.end('');
  }
}
