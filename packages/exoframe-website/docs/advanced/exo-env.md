---
sidebar_position: 4
---

# Exoframe Deployment Environment Variables

Exoframe sets environment variables on each deployment to provide access to project information and settings. The variables include:

```bash
# Owner of the current deployment
EXOFRAME_USER=admin
# Project of the current deployment
EXOFRAME_PROJECT=projectName
# Full deployment ID
EXOFRAME_DEPLOYMENT=exo-admin-deployName-ID
# Host used to expose the current deployment (if any)
EXOFRAME_HOST=exo-admin-deployName-ID.baseDomain
```

Starting with v7, the `EXOFRAME_DEPLOYMENT` value is stable when you redeploy the same project with `exoframe deploy --update`. That means logs, removal commands, and any automation that stores the deployment ID can continue working without needing to look up a new UUID. If your server has `baseDomain` configured, the automatically generated `EXOFRAME_HOST` (`<project-name>.<baseDomain>`) also remains unchanged after updates.
