# Basics

### Concepts

- **Project** - one or more deployments grouped together (e.g. started via docker-compose)
- **Deployment** - one and only one deployed service

### Commands

| Command                | Description |
| ---------------------- | ----------- |
| deploy [path]          | Deploy specified path |
| config                 | Generate or update project config for current path |
| list                   | List currently deployed projects |
| rm [id]                | Remove existing deployment or project |
| log [id]               | Get logs for existing deployment or project |
| token [ls|rm]          | Generate, list or remove deployment tokens |
| login                  | Login into Exoframe server |
| endpoint [url]         | Selects or adds the endpoint of Exoframe server |
| rm-endpoint [url]      | Removes an existing endpoint of Exoframe server |
| update [target]        | Gets current versions or updates given target |
| completion             | Generates bash completion script  |

## Project config file

All of the configuration for the deployed projects is done using `exoframe.json` config file.  
It can either be generated/updated using `exoframe config` command or created manually.  
If it doesn't exist during deployment, Exoframe will generate simple config file that only contains name of the current project.

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
    "ENV_VAR": "123"
  },
  // internal hostname for container [optional]
  // see docker docs for more info
  // no hostname is assigned by default
  "hostname": "hostname"
}
```

## CLI Configuration

Exoframe stores its config in `~/.exoframe/cli.config.yml`.  
Currently it contains list of endpoint URLs with associated usernames and authentication tokens:

```yaml
endpoint: 'http://localhost:8080' # your endpoint URL, defaults to localhost
```

## Deployment tokens

Sometimes you might need to deploy things from environments that don't have your private key (e.g. CI/CD services).   
For this cases you can use deployment tokens. Here's how it works:

1. Make sure you are logged in to your Exoframe server
2. Generate new deployment token using `exoframe token` command
3. Use the new token to deploy your service without need to authenticate: `exoframe deploy -t $TOKEN`

## Updating deployed project

Exoframe provides a way to easily update already deployed projects.  
This can be done by passing `--update` (or `-u`) flag to deploy command.  
The way it works is quite simple:

1. Exoframe deploys new version of the given project
2. Exoframe then waits for them to start up 
3. Exoframe removes the old running deployments for current project

This can be used together with deployment tokens to achieve simple continuous deployment for your projects.
