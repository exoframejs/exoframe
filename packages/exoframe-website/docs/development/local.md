---
sidebar_position: 1
---

# Using Development and Debug Versions

You might need to run Exoframe CLI and Server in development mode.  
There is currently three ways to do so.
They are described in more detail below.

## Using development versions from source

Primary way of running Exoframe CLI and Server in development mode is by using source code available in github.

### Exoframe CLI

Exoframe CLI requires you to have Node.js and yarn installed.  
To run Exoframe CLI in development follow this steps:

1. Make sure you don't have `exoframe` installed globally - if you do, remove it
2. Clone the Exoframe CLI repo: `git clone git@github.com:exoframejs/exoframe.git && cd exoframe`
3. Install dependencies: `yarn install`
4. Link Exoframe CLI to your global packages to expose it as a command: `npm link`
5. You can now run `exoframe --version` which should execute your dev version of Exoframe CLI

### Exoframe-Server

Exoframe-Server requires you to have Node.js, yarn, Docker and docker-compose installed.  
To run Exoframe-Server in development follow this steps:

1. Clone the Exoframe-Server repo: `git clone git@github.com:exoframejs/exoframe-server.git && cd exoframe-server`
2. Install dependencies: `yarn install`
3. You can now run the server by executing: `yarn start`
4. Point your Exoframe CLI to `http://localhost:8080` to access your server

## Using Exoframe-Server debug version from npm

It is also possible to run Exoframe-Server in development mode by using package available in npm.  
Exoframe-Server can be installed by running `npm install -g exoframe-server`.  
This will add `exoframe-server` binary to your system - executing it will start Exoframe-Server in development mode.  
This way also requires you to have Node.js, yarn, Docker and docker-compose installed.

## Using Exoframe-Server debug version from docker hub

It is also possible to run Exoframe-Server in development mode by using docker image available in docker hub.  
Exoframe-Server can be started by running `docker run -v ... exoframe/server:debug` (see [server setup](../getting-started/server.md) for full command).  
This will start Exoframe-Server in development mode.  
This way requires you to have Docker installed.
