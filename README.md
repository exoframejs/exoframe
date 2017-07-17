# Exoframe (beta)

> Power armor for docker containers

[![Build Status](https://travis-ci.org/exoframejs/exoframe.svg?branch=master)](https://travis-ci.org/exoframejs/exoframe)
[![Coverage Status](https://coveralls.io/repos/github/exoframejs/exoframe/badge.svg?branch=master)](https://coveralls.io/github/exoframejs/exoframe?branch=master)
[![npm](https://img.shields.io/npm/v/exoframe.svg?maxAge=2592000)](https://www.npmjs.com/package/exoframe)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg?maxAge=2592000)](https://opensource.org/licenses/MIT)

[![asciicast](https://asciinema.org/a/129255.png)](https://asciinema.org/a/129255)

## How it works

Exoframe intends to do all the heavy lifting required to build and deploy web services for you.  
Exoframe uses [Docker](https://www.docker.com/) to deploy your project and [Traefik](https://traefik.io/) to proxy them to requested domain and/or paths.  
All the configuration of your projects happens automatically. So after running the command, the only thing you need to do is wait a few seconds until your files have been built or deployed!

Currently, Exoframe understands and can deploy the following project types:

1. static html based projects - will be deployed using [nginx](http://hub.docker.com/_/nginx) image
2. node.js based projects - will be deployed using [node:alpine](https://hub.docker.com/_/node) image
3. docker based project - will be deployed using your [Dockerfile](https://docs.docker.com/engine/reference/builder/)
4. docker-compose based project - will be deployed using your [docker-compose](https://docs.docker.com/compose/compose-file/) file

To run Exoframe you need two parts - Exoframe CLI on your local machine and [Exoframe server](https://github.com/exoframejs/exoframe-server) on your server with Docker.

## Installation and Usage

Install Exoframe CLI (needs at least node v6):

```
npm install exoframe -g
```

Make sure you have [Exoframe server](https://github.com/exoframejs/exoframe-server) deployed, set it as your endpoint using:

```
exoframe endpoint http://you.server.url
```

Then use it:

```
exoframe <command> [options]
```

You can find a list of all commands and options below.

### Commands

| Command                | Description |
| ---------------------- | ----------- |
| deploy [path]          | Deploy specified path |
| config                 | Generate project config for current path |
| list                   | List currently deployed projects |
| rm [project]           | Remove existing project |
| log [project]          | Get logs for existing project |
| login                  | Login into Exoframe server |
| endpoint [url]         | Gets or sets the endpoint of Exoframe server |
| completion             | Generates bash completion script  |

## Project config file

All of the configuration for the deployed projects is done using `exoframe.json` config file.  
It can either be generated using `exoframe config` command or created manually.  
If it doesn't exist during deployment, Exoframe will generate simple config file that only contains name of the current project.

Config file has the following structure:
```js
{
  // project name
  // defaults to folder name
  "name": "project-name",
  // restart policy [optional]
  // see docker docs for more info
  // defaults to "on-failure:2"
  "restart": "on-failure:2",
  // domain to be assigned to project [optional]
  // no domain is assigned by default
  "domain": "www.project.domain.com",
  // object of key-values for env vars [optional]
  // no env vars are assigned by default
  "env": {
    "ENV_VAR": "123"
  },
  // internal hostname for container [optional]
  // see docker docs for more info
  // no hostname is assigned by default
  "hostname": "hostname"
}
```

## CLI Configuration

Exoframe stores its config in `~/.exoframe/cli.config.yml`.  
Currently it contains endpoint URL and list of template plugins:

```yaml
endpoint: 'http://localhost:8080' # your endpoint URL, defaults to localhost
```

## Contribute

1. Fork this repository to your own GitHub account and then clone it to your local device.
2. Uninstall exoframe if it's already installed: `npm uninstall exoframe -g`
3. Link it to the global module directory: `npm link`
4. Transpile the source code and watch for changes: `npm start`

Now can use the `exoframe` command everywhere.

## License

Licensed under MIT.
