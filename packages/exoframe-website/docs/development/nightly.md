---
sidebar_position: 2
---

# Using Nightly Versions

You can optionally use nightly version of Exoframe CLI and Server.  
While they do provide latest features, it is not recommended to use them for production.

## Nightly CLI builds

You can install nightly CLI builds using the following command:

```
npm install -g exoframe@next
```

## Nightly Exoframe-server builds

You can install nightly server builds by following two steps.  
First, you need to modify server config and add the following line:

```yaml
updateChannel: nightly
```

Then, you need to run `exoframe update server` against the endpoint you've configured to update to latest nightly build of server.
