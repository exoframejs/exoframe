---
sidebar_position: 3
---

# Secrets

Exoframe allows you to create server-side secret values that can be used during service deployments.
To use secrets you first need to create one. This can be done by running:

```
$ exoframe secret new
```

Once you specify the name and value, Exoframe server will create new secret _for your current user_.
After creation the secret can be used in `exoframe.json` config file by using secret name and prefixing it with `@`, like so (in this example the secret was name `my-secret`):

```json
"env": {
  "SECRET_KEY": "@my-secret"
},
```

Current caveats:

- Currently secrets only work for environment variables
- Currently secrets work only for normal deployments (any template or recipe that uses `startFromParams` won't have secrets expanded)

## Accessing Exoframe data from within the deployed application

Exoframe provides a set of environment variables that are set on each deployment to allow getting project info and settings.  
Currently those are:

```bash
# owner of current deployment
EXOFRAME_USER=admin
# project of current deployment
EXOFRAME_PROJECT=projectName
# full deployment ID
EXOFRAME_DEPLOYMENT=exo-admin-deployName-ID
# host used to expose current deployment (if any)
EXOFRAME_HOST=exo-admin-deployName-ID.baseDomain
```

## Plugins

Exoframe-Server supports extension of core features using plugins.  
Plugins are installed and loaded automatically once corresponding config is added to [server configuration](./server.md).  
Refer to specific plugins docs to see how to configure them.
