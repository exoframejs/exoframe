# Basics

## Concepts

* **Project** - one or more deployments grouped together (e.g. started via docker-compose)
* **Deployment** - one and only one deployed service

## Requirements

Exoframe CLI is not particularly demanding and consumes at max ~50mb of RAM.  
Most intensive task from CLI side is packaging the project and streaming that to the server - it doesn't affect RAM usage that much and mostly relies on CPU and network.

Running Exoframe server on its own also doesn't require too much resources:

* Exoframe Server consumes ~50mb of RAM
* Traefik started along with server consumes ~60mb of RAM

Be aware though - execution of deployments will result in (1) new Docker images being built and (2) new Docker containers being started.  
Depending on your project's complexity, this might require significant amount of resources during both steps resulting in failed deployments (note: if Docker goes out-of-memory during build, you will not get any specific error - just a failed deployment).  
It is recommended to run Exoframe on a server with at least 1GB of RAM.

## Supported project types & deployment templates

By default, Exoframe understands and can deploy the following project types:

1.  Static html based projects - will be deployed using [nginx](http://hub.docker.com/_/nginx) image
2.  Node.js based projects - will be deployed using [node:latest](https://hub.docker.com/_/node) image \*
3.  Docker based project - will be deployed using your [Dockerfile](https://docs.docker.com/engine/reference/builder/)
4.  Docker-Compose based projects - will be deployed using your [docker-compose](https://docs.docker.com/compose/compose-file/) file

\* There are two things to keep in mind for Node.js projects: (1) they are started via `npm start`, so make sure you have specified start script in your `package.json`; (2) by default port 80 is exposed, so you need to make your app listen on that port. If you'd like to execute your app in any different way or expose more ports - please use Dockerfile deployment method.

This list can be extended via deployment templates.  
You can find the list of available templates [on npm](https://www.npmjs.com/search?q=exoframe-template).  
Templates can be installed by executing `exoframe template` command and entering complete template package name.

## Complex recipes

Exoframe also provides support for third-party complex deployment recipes.  
They allow to quickly and easily deploy complex projects.

For example, you can deploy Wordpress with PHPMyAdmin by simply executing `exoframe setup` and entering [exoframe-recipe-wordpress](https://github.com/exoframejs/exoframe-recipe-wordpress) as desired recipe.

You can find the list of available recipes [on npm](https://www.npmjs.com/search?q=exoframe-recipe).

## Commands

| Command           | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| deploy [path]     | Deploy specified path                                                |
| config            | Generate or update project config for current path                   |
| list              | List currently deployed projects                                     |
| rm <id>           | Remove existing deployment or project                                |
| log <id>          | Get logs for existing deployment or project                          |
| template [ls, rm] | Add, list or remove deployment templates from the server             |
| setup [recipe]    | Setup a complex recipe deployment                                    |
| token [ls, rm]    | Generate, list or remove deployment tokens                           |
| login             | Login into Exoframe server                                           |
| endpoint [url]    | Selects or adds the endpoint of Exoframe server                      |
| rm-endpoint [url] | Removes an existing endpoint of Exoframe server                      |
| update [target]   | Gets current versions or updates given target (server, traefik, all) |
| completion        | Generates bash completion script                                     |

## Project config file

All of the configuration for the deployed projects is done using `exoframe.json` config file.  
It can either be generated/updated using `exoframe config` (or `exoframe init`) command or created manually.  
If it doesn't exist during deployment, Exoframe will generate simple config file that only contains name of the current project.

Config file has the following structure:

```js
{
  // deployment name
  // defaults to folder name
  "name": "deployment-name",
  // restart policy [optional]
  // see docker docs for more info
  // defaults to "on-failure:2"
  "restart": "on-failure:2",
  // domain to be assigned to project [optional]
  // no domain is assigned by default
  // can be set to "false" to disable auto-assignment of domain
  "domain": "www.project.domain.com",
  // project name [optional]
  // by default assembled using deployment name and username
  "project": "project-name",
  // object of key-values for env vars [optional]
  // no env vars are assigned by default
  "env": {
    "ENV_VAR": "123"
  },
  // internal hostname for container [optional]
  // see docker docs for more info
  // no hostname is assigned by default
  "hostname": "hostname",
  // Add additional docker labels to your container [optional]
  "labels": {
    "my.custom.label": "value"
  },
  // template to be used for project deployment
  // undefined by default, detected by server based on file structure
  "template": "my-template"
}
```

## Project ignore file

In some cases you might want to ignore particular files during project deployment (e.g. tests, fixtures, node_modules, etc.).  
You can specify ignored files using `.exoframeignore` file in the root of the project.  
Each line is then used by the [ignore](https://github.com/kaelzhang/node-ignore) module during deployment process.  
When not provided ignore file contains the following entries:

```
.git
node_modules
```

## CLI Configuration

Exoframe stores its config in `~/.exoframe/cli.config.yml`.  
Currently it contains list of endpoint URLs with associated usernames and authentication tokens:

```yaml
endpoint: 'http://localhost:8080' # your endpoint URL, defaults to localhost
```

## Deployment tokens

Sometimes you might need to deploy things from environments that don't have your private key (e.g. CI/CD services).  
For this cases you can use deployment tokens. Here's how it works:

1.  Make sure you are logged in to your Exoframe server
2.  Generate new deployment token using `exoframe token` command
3.  Use the new token to deploy your service without need to authenticate: `exoframe deploy -t $TOKEN`

## Updating deployed project

Exoframe provides a way to easily update already deployed projects.  
This can be done by passing `--update` (or `-u`) flag to deploy command.  
The way it works is quite simple:

1.  Exoframe deploys new version of the given project
2.  Exoframe then waits for them to start up
3.  Exoframe removes the old running deployments for current project

This can be used together with deployment tokens to achieve simple continuous deployment for your projects.
