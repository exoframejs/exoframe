---
sidebar_position: 1
---

# Quick start

## Requirements

Exoframe is not particularly demanding and consumes a maximum of ~50MB of RAM.
The most intensive task from the CLI side is packaging the project and streaming it to the server, which doesn't significantly affect RAM usage but relies more on CPU and network resources.

Running the Exoframe Server on its own is also resource-friendly:

- Exoframe Server consumes approximately ~50MB of RAM.
- Traefik started along with the server consumes around ~60MB of RAM.

However, be aware that the execution of deployments results in (1) a new Docker image being built and (2) a new Docker container being started.
Depending on your project's complexity, this may require a significant amount of resources during both steps, potentially leading to failed deployments.
Note: If Docker goes out of memory during the build, you will not receive any specific error message; the deployment will simply fail.
Therefore, it is recommended to run Exoframe on a server with at least 1GB of RAM.

## Installation and Basic Usage

To use Exoframe, you'll need two components: the Exoframe CLI and the [Exoframe Server](https://github.com/exoframejs/exoframe/tree/main/packages/exoframe-server).

### Installing Exoframe Server

To install Exoframe Server, run our installation shell script on your server using the following command:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/exoframejs/exoframe/main/packages/exoframe-server/tools/install.sh)"
```

The script will guide you through the basic setup process and can also be re-run later to upgrade an existing Exoframe Server.

For detailed manual server installation instructions, please consult the [Installing Exoframe Server](../manual-install/server.md) section.

### Installing Exoframe CLI

To install Exoframe CLI, you have two options:

1. Download one of the pre-packaged binaries from the [releases page](https://github.com/exoframejs/exoframe/releases).

2. Install it using npm (requires at least Node 18.x):

```bash
npm install exoframe -g
```

Alternatively, you can run Exoframe via `npx`:

```bash
npx exoframe --help
```

Once you have Exoframe CLI installed, ensure that [Exoframe Server](https://github.com/exoframejs/exoframe/tree/main/packages/exoframe-server) is deployed and running. Confirm its proper functioning by opening `http://your.exoframe.url` in the browser; if you see the Exoframe logo, it is working as expected.

After installation, set the server endpoint in the CLI:

```bash
exoframe endpoint http://your.server.url
```

Then, log in with:

```bash
exoframe login
```

## Deploying Your First Project

After logging in, you're ready to deploy your first project.

First, create a new Exoframe project configuration by executing the following command in the project folder:

```bash
exoframe init
```

Then, deploy your project by running the following command:

```bash
exoframe deploy
```

## Updating Deployed Projects

Exoframe provides an easy way to update deployed projects.
This can be accomplished by adding the `--update` (or `-u`) flag to the deploy command:

```bash
exoframe deploy --update
```

Here's how it works:

1. Exoframe deploys the new version of the specified project.
2. Exoframe then waits for the new version to start up.
3. Finally, Exoframe removes the old running deployments for the given project.

This feature can be combined with [deployment tokens](../advanced/deploy-token.md) to achieve [simple continuous deployment](../recipes/cd.md) for your projects.

## Next Steps

Discover more about Exoframe basics in the [Basics](./basics.md) section.
