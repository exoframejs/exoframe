# Templates guide

Exoframe allows doing complex deployments using third party recipes.  
This guide aims to explain basics you need to know to create your own recipes.  
If you are looking for recipe usage - please see [Basics](Basics.md) part of the docs.

## Basics

Exoframe uses [yarn](https://yarnpkg.com/) to install third-party recipes.  
The recipes then are executed on Exoframe server using Node.js `require()` method.  
So, make sure that your template's `package.json` has correct `main` attribute.

Your template main script needs to export the following variables and methods:

```js
// function to get list of questions that should be presented
// to user. uses Inquirer.js question format
exports.getQuestions = async () => [];

// function to execute current recipe with user answers
exports.runSetup = async props => {};
```

## Recipe props

During the execution `runSetup` will get the properties object from Exoframe server.  
This object contains all data and methods required to build and execute new docker containers.  
Here's a snippet from the Exoframe server code that shows the props object being assembled:

```js
// generate recipe props
const recipeProps = {
  // user answers
  answers,
  // server config
  serverConfig,
  // current user username
  username,
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
    // exoframe build from params function
    // has following signature: ({tarStream, tag, logLine = noop}) => {}
    // executes `docker build` on given tarStream with given tag
    // return following object: {log, image}
    buildFromParams,
    // exoframe start function
    // has the following signature: async ({image, username, resultStream}) => {}
    // executes `docker start` with given image while setting all required labels, env vars, etc
    // returns inspect info from started container
    start,
    // exoframe startFromParams function
    // has the following signature:
    //   async ({
    //     image,
    //     deploymentName,
    //     projectName,
    //     username,
    //     backendName,
    //     frontend,
    //     hostname,
    //     restartPolicy,
    //     Env = [],
    //     additionalLabels = {},
    //     Mounts = [],
    //   }) => {}
    // executes `docker start` with given image while setting all required labels, env vars, etc
    // returns inspect info from started container
    startFromParams,
    // exoframe image pulling function
    // has the following signature: async (tag) => {}
    // returns pull log on success
    pullImage,
    // exoframe network get function
    // returns currently used exoframe network
    getNetwork,
    // exoframe network creation function
    // has the following signature: async (networkName) => {}
    // finds or creates new network with given name
    // returns dockerode network object
    createNetwork,
  },
  // exoframe utilities & logger
  // see code here: https://github.com/exoframejs/exoframe-server/blob/master/src/util/index.js
  util: Object.assign({}, util, {
    logger,
  }),
};
```

## Executing the recipe

Once user has answered all your questions, you will need to execute the recipe.  
It is up to you to build _and_ start all required docker images.  
Here's an example for the Wordpress recipe:

```js
// image names
const mysqlImage = 'mariadb:latest';
const wordpressImage = 'wordpress:latest';
const phpmyadminImage = 'phpmyadmin/phpmyadmin:latest';

// ask user to provide params for deployment
exports.getQuestions = () => [
  {
    type: 'input',
    name: 'projectName',
    message: 'Wordpress project name:',
  },
  {
    type: 'input',
    name: 'mysqlPassword',
    message: 'MySQL root password:',
  },
  {
    type: 'input',
    name: 'wordpressDomain',
    message: 'Domain for Wordpress:',
  },
  {
    type: 'confirm',
    name: 'phpmyadminStart',
    message: 'Also start PHPMyAdmin?',
  },
  {
    type: 'input',
    name: 'phpmyadminDomain',
    message: 'Domain for PHPMyAdmin:',
  },
];

// start mysql
const startMysql = async ({util, answers, username, docker}) => {
  // generate new deployment name (optional, in this case we do this to have the same hostname)
  const deploymentName = util.nameFromImage(mysqlImage);
  // start new docker container / service
  return docker.startFromParams({
    // provide image name
    image: mysqlImage,
    // use project name from user answers
    projectName: answers.projectName,
    // pass in username
    username,
    // apply deployment name
    deploymentName,
    // also use deployment name for hostname
    hostname: deploymentName,
    // set restart policy
    restartPolicy: 'always',
    // create volume to persist data
    Mounts: [
      {
        Type: 'volume',
        Source: `${answers.projectName}-mysqldata`,
        Target: '/var/lib/mysql',
      },
    ],
    // pass in env vars config
    Env: [`MYSQL_ROOT_PASSWORD=${answers.mysqlPassword}`],
  });
};

// start wordpress
const startWordpress = async ({util, answers, serverConfig, username, docker, mysql}) => {
  // generate new deployment name (optional)
  const deploymentName = util.nameFromImage(wordpressImage);

  // get mysql hostname from inspect object
  const mysqlHost = serverConfig.swarm
    ? mysql.Spec.Networks[0].Aliases
    : mysql.NetworkSettings.Networks.exoframe.Aliases[0];

  // start new container / service
  return docker.startFromParams({
    // set image name
    image: wordpressImage,
    // set project name
    projectName: answers.projectName,
    // set username
    username,
    // set deployment name (can be omitted)
    deploymentName,
    // set frontend string for Traefik since we want
    // it to be accessible from web
    frontend: `Host:${answers.wordpressDomain}`,
    // set restart policy
    restartPolicy: 'always',
    // set env vars config
    Env: [`WORDPRESS_DB_HOST=${mysqlHost}`, `WORDPRESS_DB_PASSWORD=${answers.mysqlPassword}`],
  });
};

// start phpmyadmin
const startPhpmyadmin = async ({util, answers, serverConfig, username, docker, mysql}) => {
  // generate new deployment name (optional)
  const deploymentName = util.nameFromImage(phpmyadminImage);

  // get mysql hostname from inspect object
  const mysqlHost = serverConfig.swarm
    ? mysql.Spec.Networks[0].Aliases
    : mysql.NetworkSettings.Networks.exoframe.Aliases[0];

  // start container / service
  return docker.startFromParams({
    // set image name
    image: phpmyadminImage,
    // set project name from user answers
    projectName: answers.projectName,
    // set username
    username,
    // set deployment name (can be omitted)
    deploymentName,
    // set frontend rule for Traefik since we want
    // it to be accessible from web
    frontend: `Host:${answers.phpmyadminDomain}`,
    // set restart policy
    restartPolicy: 'always',
    // set env vars config
    Env: [`PMA_HOST=${mysqlHost}`, `MYSQL_ROOT_PASSWORD=${answers.mysqlPassword}`],
  });
};

exports.runSetup = async ({answers, serverConfig, username, docker, util}) => {
  // init log
  const log = [];

  try {
    util.logger.debug('starting work..');
    // start mysql container
    util.logger.debug('starting mysql..');
    const mysql = await startMysql({util, answers, username, docker});
    log.push({message: 'Mysql container started', data: mysql, level: 'info'});
    util.logger.debug('created mysql container..');

    // start wordpress container
    util.logger.debug('starting wordpress..');
    const wordpress = await startWordpress({util, answers, serverConfig, username, docker, mysql});
    log.push({message: 'Wordpress container started', data: wordpress, level: 'info'});
    util.logger.debug('created wordpress container..');

    // start phpmyadmin if needed
    if (answers.phpmyadminStart) {
      util.logger.debug('starting phpmyadmin..');
      const phpmyadmin = await startPhpmyadmin({util, answers, serverConfig, username, docker, mysql});
      log.push({message: 'PHPMyAdmin container started', data: phpmyadmin, level: 'info'});
      util.logger.debug('created phpmyadmin container..');
    }
  } catch (e) {
    util.logger.error('error:', e);
    log.push({message: e.toString(), data: e, level: 'error'});
  }

  // return log to user
  return log;
};
```

## Examples

* [Wordpress recipe](https://github.com/exoframejs/exoframe-recipe-wordpress) (incl. Wordpress, MariaDB and PHPMyAdmin)
* [HOBBIT project recipe](https://github.com/hobbit-project/exoframe-recipe-hobbit) (very complex recipe incl. volumes with configs, pre-setup scripts, etc.)
