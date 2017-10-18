# FAQ

### Is it ready for production?

Yes. We've been using it to deploy our project since May 2017 without any issues.  

### Why do I need to enter username during login?

Username is just your ID that is used to distinguish your deployments from others.  
Right now you have to enter it yourself. And you will only see deployments done with that username.  
Currently, more than one user can use same username (so, all users with that username will see same deployments).

### How does it work?

Exoframe uses [Docker](https://www.docker.com/) to deploy your project and [Traefik](https://traefik.io/) to proxy requested domains and/or paths to deployed projects.  
All the Docker configuration of your projects happens automatically. So after running the command, the only thing you need to do is wait a few seconds until your project have been built and deployed!

### What kind of projects can I deploy with Exoframe?

Currently, Exoframe understands and can deploy the following project types:

1. static html based projects - will be deployed using [nginx](http://hub.docker.com/_/nginx) image
2. node.js based projects - will be deployed using [node:alpine](https://hub.docker.com/_/node) image
3. docker based project - will be deployed using your [Dockerfile](https://docs.docker.com/engine/reference/builder/)
4. docker-compose based project - will be deployed using your [docker-compose](https://docs.docker.com/compose/compose-file/) file

