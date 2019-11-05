<img alt="Exoframe" src="./logo/png/exo_blue.png" width="300">

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
- Deploy secrets (e.g. to hide sensitive env vars)
- Automated HTTPS setup via letsencrypt \*
- Automated gzip compression \*
- Rate-limit support \*
- Basic HTTP Auth support \*
- Simple access to the logs of deployments
- Docker-compose support
- Simple function deployments
- Multiple deployment endpoints and multi-user support
- Simple update procedure for client, server and Traefik
- Optional automatic subdomain assignment (i.e. every deployment gets its own subdomain)
- Swarm mode deployments
- Complex recipes support (i.e. deploy complex systems in one command)

\* Feature provided by [Traefik](https://traefik.io/)

## Demo

[![asciicast](https://asciinema.org/a/129255.png)](https://asciinema.org/a/129255)

## Installation and Usage

To run Exoframe you will need two parts - Exoframe CLI and [Exoframe server](https://github.com/exoframejs/exoframe-server).  
For server install instructions see [server installation docs section](docs/ServerInstallation.md).

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

- [Basics](docs/Basics.md)
- [Server Installation](docs/ServerInstallation.md)
- [Server Configuration](docs/ServerConfiguration.md)
- [Advanced topics](docs/Advanced.md)
- [Function deployments](docs/Functions.md)
- [FAQ](docs/FAQ.md)
- [Contribution Guidelines](docs/Contributing.md)
- [Templates guide](docs/TemplatesGuide.md)
- [Recipes guide](docs/RecipesGuide.md)
- [Using nightly versions](docs/Nightly.md)
- [Using development and debug versions](docs/Development.md)
- [Tutorials, articles, video and related links](docs/Links.md)
- [Change Log](CHANGELOG.md)

## Special thanks

Thanks to:

- [Ivan Semenov](https://www.behance.net/ivan_semenov) for making [an awesome logo](./logo/README.md)

## License

Licensed under MIT.
