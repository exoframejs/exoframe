---
sidebar_position: 2
---

# Basics

## Supported Project Types & Deployment Templates

By default, Exoframe can understand and deploy the following project types:

1. Static HTML-based projects - deployed using the [nginx](http://hub.docker.com/_/nginx) image.
2. Node.js-based projects - deployed using the [node:latest](https://hub.docker.com/_/node) image \*
3. Docker-based projects - deployed using your [Dockerfile](https://docs.docker.com/engine/reference/builder/)

\* For Node.js projects, keep in mind two things: (1) they are started via `npm start`, so ensure you have specified a start script in your `package.json`; (2) the default exposed port is 80, so configure your app to listen on that port. If you want to use a different method or expose additional ports, utilize the Dockerfile deployment method.

This list can be expanded using deployment templates. Check the available templates [on npm](https://www.npmjs.com/search?q=exoframe-template). Install templates using the command `exoframe template` and enter the complete template package name.

## Project Ignore File

In certain cases, you might wish to exclude specific files during project deployment (e.g., tests, fixtures, node_modules, etc.). To achieve this, you can use the `.exoframeignore` file in the root of your project.

Each line in this file is utilized by the [ignore](https://github.com/kaelzhang/node-ignore) module during the deployment process. If not provided, the ignore file contains the following entries:

```plaintext
.git
node_modules
```

Specify the files you want to ignore in your project's `.exoframeignore` file to tailor the deployment process according to your needs.

## SSH Key-Based Authentication

Exoframe utilizes the [sshpk](https://github.com/TritonDataCenter/node-sshpk) package for working with SSH keys, thereby supporting RSA, DSA, ECDSA (nistp-\*), and ED25519 key types in PEM (PKCS#1, PKCS#8), and OpenSSH formats.

To generate a compatible key, you can follow the [GitHub Instructions](https://help.github.com/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/).

## Updating Exoframe Server

To update the Exoframe Server, simply run the command:

```bash
exoframe update server
```

This command will ensure that your Exoframe Server is up to date.
