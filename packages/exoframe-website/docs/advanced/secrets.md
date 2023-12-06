---
sidebar_position: 3
---

# Secrets

Exoframe allows you to create server-side secret values that can be used during service deployments. To use secrets, you first need to create one. Run the following command:

```bash
exoframe secret new
```

Once you specify the name and value, the Exoframe server will create a new secret _for your current user_. After creation, the secret can be used in the `exoframe.json` config file by using the secret name and prefixing it with `@`, like so (in this example, the secret was named `my-secret`):

```json
"env": {
  "SECRET_KEY": "@my-secret"
}
```

Current caveats:

- Currently, secrets only work for environment variables.
- Currently, secrets work only for normal deployments (any template or recipe that uses `startFromParams` won't have secrets expanded).
