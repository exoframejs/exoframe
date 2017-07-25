# Basics

### Commands

| Command                | Description |
| ---------------------- | ----------- |
| deploy [path]          | Deploy specified path |
| config                 | Generate or update project config for current path |
| list                   | List currently deployed projects |
| rm [project]           | Remove existing project |
| log [project]          | Get logs for existing project |
| login                  | Login into Exoframe server |
| endpoint [url]         | Gets or sets the endpoint of Exoframe server |
| completion             | Generates bash completion script  |

## Project config file

All of the configuration for the deployed projects is done using `exoframe.json` config file.  
It can either be generated/updated using `exoframe config` command or created manually.  
If it doesn't exist during deployment, Exoframe will generate simple config file that only contains name of the current project.

Config file has the following structure:
```js
{
  // project name
  // defaults to folder name
  "name": "project-name",
  // restart policy [optional]
  // see docker docs for more info
  // defaults to "on-failure:2"
  "restart": "on-failure:2",
  // domain to be assigned to project [optional]
  // no domain is assigned by default
  "domain": "www.project.domain.com",
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
Currently it contains endpoint URL and list of template plugins:

```yaml
endpoint: 'http://localhost:8080' # your endpoint URL, defaults to localhost
```
