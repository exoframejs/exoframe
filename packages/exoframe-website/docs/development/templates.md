---
sidebar_position: 3
---

# Templates guide

Exoframe allows extending the types of deployments it supports using third party plugins.  
This guide aims to explain basics you need to know to create your own templates.  
If you are looking for template usage - please see [Basics](../basics.md) part of the docs.

## Basics

Exoframe uses [yarn](https://yarnpkg.com/) to install and remove third-party templates.  
The templates then are added to Exoframe server using Node.js `require()` method.  
So, make sure that your template's `package.json` has correct `main` attribute.

Your template main script needs to export the following variables and methods:

```js
// template name
// can be used by user to specify the template in config
exports.name = 'mytemplate';

// function to check if the template fits the project
// will be executed unless template is specified by user explicitly
exports.checkTemplate = async (props) => {};

// function to execute current template
// handle building and starting the containers
exports.executeTemplate = async (props) => {};
```

## Template props

Both `checkTemplate` and `executeTemplate` get the same properties object upon execution.  
This object contains all data and methods required to build and execute new docker containers.  
Here's a snippet from the Exoframe server code that shows the props object being assembled:

```js
// generate template props
const templateProps = {
  // user project config
  config,
  // current user username
  username,
  // response stream, used to send log back to user
  resultStream,
  // temp dir that contains the project
  tempDockerDir,
  // docker-related things
  docker: {
    // docker daemon, instance of dockerode
    daemon: docker,
    // exoframe build function
    // has following signature: async ({username, resultStream}) => {}
    // executes `docker build` in project temp dir
    // returns following object: {log, image}
    build,
    // exoframe start function
    // has the following signature: async ({image, username, resultStream}) => {}
    // executes `docker start` with given image while setting all required labels, env vars, etc
    // returns inspect info from started container
    start,
  },
  // exoframe utilities & logger
  // see code here: https://github.com/exoframejs/exoframe-server/blob/master/src/util/index.js
  util: Object.assign({}, util, {
    logger,
  }),
};
```

## Checking if the projects fit your template

First thing Exoframe server will do is execute your `checkTemplate` function to see if your template fits the current project.  
Typically you'd want to read the list of files in temporary project folder and see if it contains files related to your template type.  
Here's an example of the core static HTML template, it check whether folder contains `index.html` file:

```js
// function to check if the template fits this recipe
exports.checkTemplate = async ({ tempDockerDir }) => {
  // if project already has dockerfile - just exit
  try {
    const filesList = fs.readdirSync(tempDockerDir);
    if (filesList.includes('index.html')) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
};
```

## Executing the template

Once you've determined that the project is indeed supported by your template, you will need to execute it.  
It is up to you to build _and_ start a docker image.  
Here's an example for the same static HTML core template that deploys current project using Nginx Dockerfile:

```js
const nginxDockerfile = `FROM nginx:latest
COPY . /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html
`;

// function to execute current template
exports.executeTemplate = async ({ username, tempDockerDir, resultStream, util, docker }) => {
  try {
    // generate new dockerfile
    const dockerfile = nginxDockerfile;
    // write the file to project temp dir
    const dfPath = path.join(tempDockerDir, 'Dockerfile');
    fs.writeFileSync(dfPath, dockerfile, 'utf-8');
    // send log to user
    util.writeStatus(resultStream, { message: 'Deploying Static HTML project..', level: 'info' });

    // build docker image
    const buildRes = await docker.build({ username, resultStream });
    // send results to user
    util.logger.debug('Build result:', buildRes);

    // check for errors in build log
    if (
      buildRes.log
        .map((it) => it.toLowerCase())
        .some((it) => it.includes('error') || (it.includes('failed') && !it.includes('optional')))
    ) {
      // if there are - add to server log
      util.logger.debug('Build log contains error!');
      // and report to user
      util.writeStatus(resultStream, { message: 'Build log contains errors!', level: 'error' });
      // and end the result stream immediately
      resultStream.end('');
      return;
    }

    // start image
    const containerInfo = await docker.start(Object.assign({}, buildRes, { username, resultStream }));
    // log results in server logs
    util.logger.debug(containerInfo.Name);

    // clean temp folder
    await util.cleanTemp();

    // get container info
    const containerData = docker.daemon.getContainer(containerInfo.Id);
    const container = await containerData.inspect();
    // return new deployments to user
    util.writeStatus(resultStream, { message: 'Deployment success!', deployments: [container], level: 'info' });
    // end result stream
    resultStream.end('');
  } catch (e) {
    // if there was an error - log it in server log
    util.logger.debug('build failed!', e);
    // return it to user
    util.writeStatus(resultStream, { message: e.error, error: e.error, log: e.log, level: 'error' });
    // end result stream
    resultStream.end('');
  }
};
```

## Examples

- [Core templates](https://github.com/exoframejs/exoframe-server/tree/master/src/docker/templates) (incl. node, nginx, dockerfile and docker-compose)
- [Java template](https://github.com/exoframejs/exoframe-template-java)
