---
sidebar_position: 5
---

# Deployment Tokens

Sometimes you might need to deploy things from environments that don't have your private key (e.g. CI/CD services).
For this cases you can use deployment tokens. Here's how it works:

1.  Make sure you are logged in to your Exoframe server
2.  Generate new deployment token using `exoframe token` command
3.  Use the new token to deploy your service without need to authenticate: `exoframe deploy -t $TOKEN`
