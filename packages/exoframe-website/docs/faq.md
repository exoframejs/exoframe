---
sidebar_position: 7
---

# FAQ

## Is it ready for production?

Yes. We've been using it to deploy our project since May 2017 without any issues.

## Why do I need to enter username during login?

Username is just your ID that is used to distinguish your deployments from others.  
Right now you have to enter it yourself. And you will only see deployments done with that username.  
Currently, more than one user can use same username (so, all users with that username will see same deployments).

## How does it work?

Exoframe uses [Docker](https://www.docker.com/) to deploy your project and [Traefik](https://traefik.io/) to proxy requested domains and/or paths to deployed projects.  
All the Docker configuration of your projects happens automatically. So after running the command, the only thing you need to do is wait a few seconds until your project has been built and deployed!

## How do I stop my server from doing the builds?

Building on a small server can eat up most of its CPU, RAM and disk. There are three ways around that, in increasing order of setup effort:

- **Local builds** — set `"build": { "local": true }` or deploy with `--build-local`. Exoframe builds the image with your local Docker, saves it, and ships it to the server; the server only loads the image and starts a container. Needs nothing but a local Docker and a `Dockerfile`. See the [local builds recipe](./recipes/local-build.md). Note that the whole image, base layers included, is uploaded (gzipped) on every deploy, and that you have to set the target platform yourself if your machine and your server use different architectures.
- **A prebuilt image or image tar** — set [`image`](./config/project.md) to deploy an image the server pulls, or `image` plus `imageFile` to deploy an image tar you built and saved yourself. This is the manual version of local builds: you own the build, the tagging and the `docker save`, which is useful when the image is produced by something other than Exoframe (say, an existing CI pipeline).
- **A registry** — build and push in CI, then deploy with `image` pointing at the pushed tag. Only the changed layers ever move, so it's by far the most efficient option for large or frequently deployed images. The cost is that you need a registry, and Exoframe currently pulls without authentication, so the image has to be publicly readable or already pulled on the server.
