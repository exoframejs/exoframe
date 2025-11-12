---
sidebar_position: 1
---

# Project Configuration File

All configuration for deployed projects is managed using the `exoframe.json` config file. It can be generated or updated with the `exoframe config` (or `exoframe init`) command or created manually. If it doesn't exist during deployment, Exoframe will generate a simple config file containing only the name of the current project.

You can also instruct Exoframe to use an alternative config file during deployment by supplying the `--config` (or `-c`) flag, for example: `exoframe -c exoframe.dev.json`

The config file has the following structure:

```json
{
  // Deployment name (defaults to folder name)
  "name": "deployment-name",
  // Restart policy [optional, defaults to "on-failure:2"]
  // See Docker docs for more info
  "restart": "on-failure:2",
  // Domain to be assigned to the project [optional, no domain is assigned by default]
  // Set to "false" to disable auto-assignment of a domain
  "domain": "www.project.domain.com",
  // Exposed port to be used [optional, defaults to the first exposed port]
  // If no ports are exposed, it will default to 80
  "port": "80",
  // Project name [optional, assembled using deployment name and username by default]
  "project": "project-name",
  // Object of key-values for environment variables [optional, no env vars are assigned by default]
  "env": {
    "ENV_VAR": "123",
    // Use secrets to hide sensitive values from env vars
    "OTHER_VAR": "@my-secret"
  },
  // Object of key-values for build args [optional, no env vars are assigned by default]
  // Used during docker image build phase
  "buildargs": {
    "BUILD_ARG": "123",
    // Use secrets to hide sensitive values from build args
    "OTHER_ARG": "@my-secret"
  },
  // Additional Docker labels for your container [optional]
  "labels": {
    "my.custom.label": "value",
    // Use available Traefik middlewares
    // Automatically added to the current deployment using the name
    // Below is an example showing basic redirect middleware usage
    "traefik.http.middlewares.my-redirectregex.redirectregex.regex": "^https://domain.redirect/(.*)",
    "traefik.http.middlewares.my-redirectregex.redirectregex.replacement": "https://domain.new/$${1}"
  },
  // Additional Traefik middlewares you might have defined
  // Either in Docker or any other middleware collection
  "middlewares": ["my-middleware@docker"],
  // Additional Docker volumes for your container [optional]
  // Format: "source:destination[:type]". Type defaults to "volume",
  // but you can specify other Docker mount types such as "bind" or "tmpfs".
  // While you can use server paths in the source place, named volumes are recommended.
  "volumes": [
    "sourceVolume:/path/in/container",
    "/tmp/local-cache:/app/cache:bind"
  ],
  // Internal hostname for the container [optional]
  // See Docker docs for more info
  // No hostname is assigned by default
  "hostname": "hostname",
  // Template to be used for project deployment
  // Undefined by default, detected by the server based on file structure
  "template": "my-template",
  // Image to be used to deploy the current project
  // This option overrides any other type of deployment
  // It makes Exoframe deploy the project using the given image name
  "image": "",
  // Image file to load an image from
  // Exoframe will load the given tar file into the Docker daemon before
  // Executing the image deployment
  "imageFile": "",
  // Whether to use gzip on the given domain [optional]
  // Can also be set for all deployments using server config
  // Per-project option will override the global setting
  "compress": false,
  // Whether to use Let's Encrypt on the given domain [optional]
  // Can also be set for all deployments using server config
  // Per-project option will override the global setting
  "letsencrypt": false,
  // Rate-limit config [optional]
  // See "advanced topics" for more info
  "rateLimit": {
    // Request rate over a given time period
    "average": 1,
    // Max burst request rate over a given time period
    "burst": 5
  },
  // Basic auth [optional]
  // Allows you to have basic auth to access your deployed service
  // Format is in user:pwhash
  "basicAuth": "user:$apr1$$9Cv/OMGj$$ZomWQzuQbL.3TRCS81A1g/"
}
```

This structure defines various options for configuring the deployment of your projects.
