# Plugins guide

Exoframe allows extending the core functionality of Exoframe-Server using third party plugins.  
This guide aims to explain basics you need to know to create your own plugins.  
If you are looking for plugins usage - please see [Advanced](Advanced.md) part of the docs.

## Basics

Exoframe uses [yarn](https://yarnpkg.com/) to install and remove third-party plugins.  
The plugins then are added to Exoframe-Server using Node.js `require()` method.  
So, make sure that your plugin's `package.json` has correct `main` attribute.

Your plugins main script needs to export the following variables and methods:

```js
module.exports = {
  // plugin default config
  config: {
    // plugin name
    name: 'exoframe-plugin-swarm',
    // whether plugin requires exclusive hooks to exoframe methods
    // exclusive hooks are the only ones being executed
    // make sure you only run ONE exclusive plugin at a time
    exclusive: true,
  },

  /* plugin functions that hook into Exoframe-Server methods */
  // server init function hook
  // should initialize traefik, setup networks, etc
  init,
  // exoframe start function hook
  // should start a deployment from files
  start,
  // exoframe startFromParams function hook
  // should start a deployment from given set of params
  startFromParams,
  // exoframe list function hook
  // should list currently active deployments
  list,
  // exoframe logs function hook
  // should get logs for a given deployment
  logs,
  // exoframe remove function hook
  // should remove a given deployment
  remove,
  // exoframe compose template extension
  // can affect how docker-compose template is executed
  compose,
};
```

## Examples

- [Swarm plugin](https://github.com/exoframejs/exoframe-plugin-swarm)
