---
sidebar_position: 5
---

# Building Images Locally

By default, Exoframe uploads your project to the server and builds the image there.
On a small server, that build can eat up most of the available CPU, RAM and disk.

Local builds move the build to the machine you deploy from: Exoframe builds the image with your
local Docker, saves it, and ships the resulting image to the server.
The server only loads the image and starts a container from it.

## Requirements

- Docker installed and available in `PATH` on the machine you deploy from. If it isn't, the deploy
  fails with "Docker not found! You need to install Docker and have it available in your PATH to
  build locally."
- A `Dockerfile` in your project. Local builds don't use the Node.js or static templates, since
  those generate their Dockerfile on the server.

## Usage

Either pass the flag:

```sh
exoframe deploy --build-local
```

Or enable it in `exoframe.json`, which also makes it work in CI:

```json
{
  "name": "my-project",
  "build": {
    "local": true
  }
}
```

The flag wins over the config value.

## Deploying to a different architecture

If your machine and your server use different architectures (for example, deploying from an
arm64 laptop to an amd64 server), the image built locally won't run on the server.

Exoframe cannot detect this for you, and the mismatch does not fail the deploy. The server loads
the image and starts the container just fine, so the deploy is reported as successful — the
container then exits immediately, and `exoframe logs` shows an `exec format error`. If a local
build deploys cleanly but the container refuses to stay up, this is the first thing to check.

Run `docker version --format '{{.Server.Arch}}'` on both machines to compare. Apple Silicon Macs
and Raspberry Pis are `arm64`, while most virtual servers are `amd64`, so the two differ more
often than not. When they do, set the target platform explicitly:

```json
{
  "name": "my-project",
  "build": {
    "local": true,
    "platform": "linux/amd64"
  }
}
```

Or pass it on the command line, which wins over the config value:

```sh
exoframe deploy --build-local --platform linux/amd64
```

Cross-platform builds require [Buildx](https://docs.docker.com/build/) support in your local
Docker installation. Building for a foreign architecture emulates it via QEMU, so any `RUN` step
in your Dockerfile will be considerably slower than a native build.

## Things to keep in mind

- **Only the image is uploaded, not your sources.** The build context still respects
  `.exoframeignore`, so local and server builds see exactly the same files.
- **Uploads are bigger.** A saved image contains every layer, including the base image, and
  cannot be deduplicated against what the server already has. Every deploy uploads the whole
  thing. The image is gzipped before upload, which typically cuts it to around half the size
  `docker save` produces.
- **Build args referencing server secrets are not supported.** Values like `"@my-secret"` in
  [`buildargs`](./buildargs.md) are resolved from the server's secret store at build time, which a
  local build cannot do. Deploying such a project with local builds fails with an explicit error
  before anything is built, rather than baking a literal `@my-secret` into your image.
- **The `template` option is ignored.** The server never sees your sources, only the finished
  image, so it always deploys locally built projects with the `image` template.
- **Build output goes through the deploy log.** Run with `-vv` to see it:
  `exoframe deploy --build-local -vv`.

## Related options

If you'd rather build and save the image yourself, you can also use the
[`image` and `imageFile` options](../config/project.md) directly, which deploy a prebuilt image
or a prebuilt image tar without Exoframe running any build at all.
