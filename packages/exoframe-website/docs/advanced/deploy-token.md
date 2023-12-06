---
sidebar_position: 5
---

# Deployment Tokens

In some cases, you may need to deploy from environments that don't have your private key, such as CI/CD services. For these situations, you can use deployment tokens. Here's how it works:

1. Make sure you are logged in to your Exoframe server.
2. Generate a new deployment token using the `exoframe token add` command.
3. Deploy your service using the new token without the need for authentication: `exoframe deploy -t $TOKEN`.
