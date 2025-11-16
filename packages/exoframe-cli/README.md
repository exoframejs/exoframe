# Exoframe

> Simple Docker deployment tool

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

## License

Licensed under MIT.
