# FAQ

### Why do I need to enter username during login?

Username is just your ID that is used to distinguish your deployments from others.  
Right now you have to enter it yourself. And you will only see deployments done with that username.  
Currently, more than one user can use same username (so, all users with that username will see same deployments).

### What kind of projects can I deploy with Exoframe?

Currently, Exoframe understands and can deploy the following project types:

1. static html based projects - will be deployed using [nginx](http://hub.docker.com/_/nginx) image
2. node.js based projects - will be deployed using [node:alpine](https://hub.docker.com/_/node) image
3. docker based project - will be deployed using your [Dockerfile](https://docs.docker.com/engine/reference/builder/)
4. docker-compose based project - will be deployed using your [docker-compose](https://docs.docker.com/compose/compose-file/) file

