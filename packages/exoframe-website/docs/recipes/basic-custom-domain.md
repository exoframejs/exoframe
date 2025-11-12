---
sidebar_position: 2
---

# Basic Deployment with Custom Domain

Follow this recipe to deploy a typical web app, assign it a custom domain, and provide environment variables (including secrets).

## 1. Prepare your project

- Ensure the Exoframe server already runs and your DNS record points your custom domain to that server’s IP.
- Install the CLI locally and log in once: `exoframe login`.
- From your project folder, initialize config scaffolding with `exoframe init` (or `exoframe config` to update an existing file).

## 2. Describe the deployment

Create or edit `exoframe.json` in the project root:

```json title="exoframe.json"
{
  "name": "my-app",
  "domain": "app.example.com",
  "env": {
    "NODE_ENV": "production",
    "API_URL": "https://api.example.com",
    "SECRET_KEY": "@app-secret"
  },
  "restart": "on-failure:2"
}
```

- `domain` assigns the public hostname. The server will request/renew TLS if Let’s Encrypt is enabled globally.
- `env` holds runtime configuration. Prefix any value with `@` to reference an Exoframe secret (create it once via `exoframe secret new`).
- Optional fields like `restart`, `project`, or `port` can be customized as needed.

## 3. Deploy the project

Run `exoframe deploy` (add `-c path/to/config` if you use a non-default config file). The CLI will:

1. Upload the bundle to the Exoframe server.
2. Build the project on server (or reuse an image if defined).
3. Start the container with the provided environment variables and issue certificates for the domain.

## 4. Verify the deployment

- Check deployment status: `exoframe ls | grep my-app`.
- Visit `https://app.example.com` to confirm the app responds.
- Update environment values by editing `exoframe.json` and redeploying; only the changed container is recreated.
