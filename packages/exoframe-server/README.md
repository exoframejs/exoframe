# Exoframe Server

> Simple Docker deployment tool

[![CI: Test](https://github.com/exoframejs/exoframe-server/workflows/Test/badge.svg)](https://github.com/exoframejs/exoframe-server/actions?query=workflow%3ATest)
[![CI: Release](https://github.com/exoframejs/exoframe-server/workflows/Release/badge.svg)](https://github.com/exoframejs/exoframe-server/actions?query=workflow%3ARelease)
[![Coverage Status](https://coveralls.io/repos/github/exoframejs/exoframe-server/badge.svg?branch=master)](https://coveralls.io/github/exoframejs/exoframe-server?branch=master)
[![Docker Pulls](https://img.shields.io/docker/pulls/exoframe/server.svg)](https://hub.docker.com/r/exoframe/server/)
[![Docker image size](https://images.microbadger.com/badges/image/exoframe/server.svg)](https://microbadger.com/images/exoframe/server)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://opensource.org/licenses/MIT)

Exoframe is a self-hosted tool that allows simple one-command deployments using Docker.

## Installation, usage and docs

For more details on how to get it up and running please follow the following link [how to setup exoframe-server](https://github.com/exoframejs/exoframe/tree/master/docs).

## Development

```bash
# Start the development setup:
yarn docker:start

# Run something inside of the exoframe container:
yarn docker:exec [command]

# Test your code:
yarn lint
yarn test
```

## License

Licensed under MIT.
