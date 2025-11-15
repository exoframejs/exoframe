---
sidebar_position: 1
---

# Continuous Deployment with Exoframe

You do not need a custom GitHub Action to deploy with Exoframe - just run the CLI inside your workflow and pass a deploy token.

## 1. Create and store a deploy token

1. Run `exoframe token add ci-deploy` locally and copy the generated token.
2. Add it as a CI secret (for GitHub: `Settings → Secrets and variables → Actions → New repository secret`) named `EXO_TOKEN`.

## 2. Add a workflow

```yaml title=".github/workflows/deploy.yml"
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js 24
        uses: actions/setup-node@v4
        with:
          node-version: 24
      - name: Install dependencies
        run: npm install --ci
      - name: Deploy via Exoframe
        run: npx exoframe deploy -u -e https://exoframe.example.net -t $EXO_TOKEN
        env:
          EXO_TOKEN: ${{ secrets.EXO_TOKEN }}
```

- `-u` tells Exoframe to run an update so the deployment keeps its existing UUID, domain, and certificates.
- `-e` is your Exoframe server endpoint.
- `-t` consumes the deploy token exposed as `EXO_TOKEN`.

## 3. Customize for your stack

- Replace `npm install` with `bun`, `pnpm`, or additional build steps (e.g., `npm run build`).
- Pass `-c exoframe.prod.json` if you keep multiple configs.
- Limit the trigger (`on:` block) to whichever branches/tags you consider production.
- On other CI providers, follow the same blueprint: install Node, prepare your workspace, run `npx exoframe deploy` with the endpoint and token.

Once configured, every push to the selected branch automatically builds your project and redeploys it via Exoframe without any extra wrappers.
