<img alt="Exoframe" src="./logo/png/exo_blue.png" width="300">

> Simple Docker deployment tool

> :warning: **This is a pre-release version**: it might be unstable at the moment!
> If you are looking for stable version and docs - look in [legacy-master]() branch.

[![Test Status](https://github.com/exoframejs/exoframe/workflows/Test/badge.svg)](https://github.com/exoframejs/exoframe/actions?query=workflow%3ATest)
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
- Multiple deployment endpoints and multi-user support
- Simple update procedure for client, server and Traefik
- Optional automatic subdomain assignment (i.e. every deployment gets its own subdomain)
- Complex recipes support (i.e. deploy complex systems in one command)

\* Feature provided by [Traefik](https://traefik.io/)

## Demo

[![asciicast](https://asciinema.org/a/129255.png)](https://asciinema.org/a/129255)

## Getting started

To be done.

## Docs

To be done.

## Special thanks

Thanks to:

- [Ivan Semenov](https://www.behance.net/ivan_semenov) for making [an awesome logo](./logo/README.md)

## License

Licensed under MIT.
