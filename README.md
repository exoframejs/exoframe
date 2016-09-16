# Exoframe (alpha)

> Power armor for docker containers

[![Build Status](https://travis-ci.org/exoframejs/exoframe.svg?branch=master)](https://travis-ci.org/exoframejs/exoframe)
[![Coverage Status](https://coveralls.io/repos/github/exoframejs/exoframe/badge.svg?branch=master)](https://coveralls.io/github/exoframejs/exoframe?branch=master)
[![npm](https://img.shields.io/npm/v/exoframe.svg?maxAge=2592000)](https://www.npmjs.com/package/exoframe)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg?maxAge=2592000)](https://opensource.org/licenses/MIT)

[![asciicast](https://asciinema.org/a/85154.png)](https://asciinema.org/a/85154)

## How it works

Exoframe intends to do all the heavy lifting required to build, deploy and manage Docker containers for you.  
It will detect your project type, pick fitting Dockerfile, ignore unneeded files (e.g. logs, local build artifacts, etc), suggest a tag for your image, add labels that reflect your ownership and much more.  
All of this happens completely automatically. So after running the command, the only thing you need to do is wait a few seconds until your files have been built or deployed!

Project detection is done using templating system.
By default, Exoframe includes following templates:

1. [nginx](https://github.com/exoframejs/exoframe-template-nginx) - for static html based projects
2. [node](https://github.com/exoframejs/exoframe-template-node) - for node.js based projects
3. [maven](https://github.com/exoframejs/exoframe-template-maven) - for maven based projects

To run Exoframe you need two parts - Exoframe CLI on your local machine and [Exoframe server](https://github.com/exoframejs/exoframe-server) on your server with Docker.

### Features list

- Authentication and access control with image and container ownership (know who has built and deployed things)
- Build your projects in Docker without writing Dockerfiles (no docker knowledge required)
- Deploy your projects using assisted interface (no more looking up how to map docker ports or link containers)
- Manage your running services using assisted interface (no need to remember all the container names)
- Extensible project templating system (missing project type? create your own!)

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
| completion             | Generates bash completion script  |
| endpoint <url>         | Sets the endpoint of Exoframe server |
| login                  | Login into Exoframe server |
| build                  | Build current folder into docker image |
| list [type]            | List owned images, running services or registry images |
| deploy [image]         | Deploy specified image using docker |
| stop [service]         | Stop running service |
| rm [service]           | Remove non-running service |
| pull <image>           | Pull image from registry |
| update                 | Trigger update of installed Exoframe plugins |
| status                 | Get Exoframe status and config |


## Configuration

Exoframe stores its config in `~/.exoframe/cli.config.yml`.  
Currently it contains endpoint URL and list of template plugins:

```yaml
endpoint: 'http://localhost:3000' # your endpoint URL, defaults to localhost

plugins: # list of plugins by categories
  templates: # template plugins
    - exoframe-template-node # default node.js template plugin
    - exoframe-template-maven # default maven template plugin
    - exoframe-template-nginx # default nginx template plugin
    - my-template-npm-package # you can use npm package name here
    - my-git-plugin: git+https://u:pwd@githost.com/user/my-git-plugin.git # you can also use git npm packages
```

## Contribute

1. Fork this repository to your own GitHub account and then clone it to your local device.
2. Uninstall exoframe if it's already installed: `npm uninstall exoframe -g`
3. Link it to the global module directory: `npm link`
4. Transpile the source code and watch for changes: `npm start`

Now can use the `exoframe` command everywhere.

## License

Licensed under MIT.
