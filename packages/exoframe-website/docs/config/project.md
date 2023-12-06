---
sidebar_position: 1
---

# Project Config File

All of the configuration for the deployed projects is done using `exoframe.json` config file.
It can either be generated/updated using `exoframe config` (or `exoframe init`) command or created manually.
If it doesn't exist during deployment, Exoframe will generate simple config file that only contains name of the current project.

You can also tell Exoframe to use alternative config file during deployment by supplying `--config` (or `-c`) flag, e.g.: `exoframe -c exoframe.dev.json`

Config file has the following structure:

```js
{
  // deployment name
  // defaults to folder name
  "name": "deployment-name",
  // restart policy [optional]
  // see docker docs for more info
  // defaults to "on-failure:2"
  "restart": "on-failure:2",
  // domain to be assigned to project [optional]
  // no domain is assigned by default
  // can be set to "false" to disable auto-assignment of domain
  "domain": "www.project.domain.com",
  // project name [optional]
  // by default assembled using deployment name and username
  "project": "project-name",
  // object of key-values for env vars [optional]
  // no env vars are assigned by default
  "env": {
    "ENV_VAR": "123",
    // you can use secrets to hide sensitive values from env vars
    "OTHER_VAR": "@my-secret"
  },
  // internal hostname for container [optional]
  // see docker docs for more info
  // no hostname is assigned by default
  "hostname": "hostname",
  // which exposed port should be used [optional]
  // will default to first exposed port
  // if no ports are exposed - will use 80
  "port": "80",
  // whether to use gzip on given domain [optional]
  // can also be set for all deployments using server config
  // per-project option will override global setting
  "compress": false,
  // whether to use letsencrypt on given domain [optional]
  // can also be set for all deployments using server config
  // per-project option will override global setting
  "letsencrypt": false,
  // Add additional docker labels to your container [optional]
  "labels": {
    "my.custom.label": "value",
    // you can also use any available traefik middlewares
    // they will be automatically added to current deployment using name
    // below is an example showing basic redirect middleware usage
    "traefik.http.middlewares.my-redirectregex.redirectregex.regex": "^https://domain.redirect/(.*)",
    "traefik.http.middlewares.my-redirectregex.redirectregex.replacement": "https://domain.new/$${1}"
  },
  // any additional traefik middlewares you might have defined
  // either in docker or any other middleware collection
  "middlewares": ["my-middleware@docker"],
  // Add additional docker volumes to your container [optional]
  // while you can use server paths in sourceVolume place
  // it is recommended to use named volumes
  "volumes": [
    "sourceVolume:/path/in/container"
  ],
  // rate-limit config
  // see "advanced topics" for more info
  "rateLimit": {
    // request rate over given time period
    "average": 1,
    // max burst request rate over given time period
    "burst": 5,
  },
  // function deployment config
  // see "function deployments" for more info
  "function": {
    // type of function (http, worker, trigger or custom)
    "type": "http",
    // route for HTTP function, [optional] defaults to `/${config.name}`
    "route": "/test"
  },
  // template to be used for project deployment
  // undefined by default, detected by server based on file structure
  "template": "my-template",
  // image to be used to deploy current project
  // this option overrides any other type of deployment and makes
  // exoframe deploy project using given image name
  "image": "",
  // image file to load image from
  // exoframe will load given tar file into docker daemon before
  // executing image deployment
  "imageFile": "",
  // basic auth, [optional]
  // this field allows you to have basic auth to access your deployed service
  // format is in user:pwhash
  "basicAuth": "user:$apr1$$9Cv/OMGj$$ZomWQzuQbL.3TRCS81A1g/"
}
```

## Exoframe CLI - Configuration

Exoframe stores its config in `~/.config/exoframe/cli.config.yml`.
Currently it contains list of endpoint URLs with associated usernames and authentication tokens:

```yaml
endpoint: 'http://localhost:8080' # your endpoint URL, defaults to localhost
```
