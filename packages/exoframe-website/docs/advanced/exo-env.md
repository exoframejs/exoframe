---
sidebar_position: 4
---

# Accessing Exoframe data from within the deployed application

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
