# Exoframe

[![Greenkeeper badge](https://badges.greenkeeper.io/exoframejs/exoframe.svg)](https://greenkeeper.io/)

> Simple Docker deployment tool

[![Build Status](https://travis-ci.org/exoframejs/exoframe.svg?branch=master)](https://travis-ci.org/exoframejs/exoframe)
[![Coverage Status](https://coveralls.io/repos/github/exoframejs/exoframe/badge.svg?branch=master)](https://coveralls.io/github/exoframejs/exoframe?branch=master)
[![npm](https://img.shields.io/npm/v/exoframe.svg)](https://www.npmjs.com/package/exoframe)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg?maxAge=2592000)](https://opensource.org/licenses/MIT)

Exoframe is a self-hosted tool that allows simple one-command deployments using Docker.

## Features

- One-command project deployment
- SSH key based auth
- Rolling updates
- Deploy tokens (e.g. to deploy from CI)
- Automated HTTPS setup via letsencrypt *
- Automated gzip compression *
- Simple access to the logs of deployments
- Docker-compose support
- Multiple deployment endpoints and multi-user support
- Simple update procedure for client, server and Traefik
- Optional automatic subdomain assignment (i.e. every deployment gets its own subdomain)

\* Feature provided by [Traefik](https://traefik.io/)

## Demo

[![asciicast](https://asciinema.org/a/129255.png)](https://asciinema.org/a/129255)

## Installation and Usage

To run Exoframe you will need two parts - Exoframe CLI and [Exoframe server](https://github.com/exoframejs/exoframe-server).  
For server install instructions see [Exoframe server repository](https://github.com/exoframejs/exoframe-server).

To install Exoframe CLI you can either download one of the pre-packaged binaries from [releases page](https://github.com/exoframejs/exoframe/releases) or install it using npm (needs at least Node 8.x):

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

Then you will be able to deploy your projects by simply running:

```
exoframe
```

You can find a list of all commands and options in the [docs](./docs/README.md).

## Docs

You can find project documentation in the [docs folder](./docs/README.md).

## License

Licensed under MIT.
