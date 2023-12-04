---
sidebar_position: 1
---

# Installing Exoframe

## Requirements

Exoframe CLI is not particularly demanding and consumes at max ~50mb of RAM
Most intensive task from CLI side is packaging the project and streaming that to the server - it doesn't affect RAM usage that much and mostly relies on CPU and network.

Running Exoframe server on its own also doesn't require too much resources:

- Exoframe Server consumes ~50mb of RAM
- Traefik started along with server consumes ~60mb of RAM

Be aware though - execution of deployments will result in (1) new Docker images being built and (2) new Docker containers being started.
Depending on your project's complexity, this might require significant amount of resources during both steps resulting in failed deployments (note: if Docker goes out-of-memory during build, you will not get any specific error - just a failed deployment).
It is recommended to run Exoframe on a server with at least 1GB of RAM.

## Installation and Basic Usage

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
