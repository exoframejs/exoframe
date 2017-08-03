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

Then login using:

```
exoframe login
```

Then deploy your project by simply running:

```
exoframe
```

You can find a list of all commands and options in the [docs](./docs/README.md).

## Docs

You can find project documentation [here](./docs/README.md).

## Contribute

1. Fork this repository to your own GitHub account and then clone it to your local device.
2. Uninstall exoframe if it's already installed: `npm uninstall exoframe -g`
3. Link it to the global module directory: `npm link`
4. Transpile the source code and watch for changes: `npm start`

Now can use the `exoframe` command everywhere.

## License

Licensed under MIT.
