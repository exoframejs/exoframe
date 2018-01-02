# FAQ

## Is it ready for production?

Yes. We've been using it to deploy our project since May 2017 without any issues.

## Why do I need to enter username during login?

Username is just your ID that is used to distinguish your deployments from others.  
Right now you have to enter it yourself. And you will only see deployments done with that username.  
Currently, more than one user can use same username (so, all users with that username will see same deployments).

## How does it work?

Exoframe uses [Docker](https://www.docker.com/) to deploy your project and [Traefik](https://traefik.io/) to proxy requested domains and/or paths to deployed projects.  
All the Docker configuration of your projects happens automatically. So after running the command, the only thing you need to do is wait a few seconds until your project have been built and deployed!
