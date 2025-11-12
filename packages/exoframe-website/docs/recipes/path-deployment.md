---
sidebar_position: 3
---

# Deploying to a Path Prefix

Use this guide when you want to host a service at `example.com/tools` instead of a dedicated subdomain.

## 1. Decide on routing

Traefik routes traffic based on rules. For path-based routing, combine a `Host()` rule with `PathPrefix()` (or `Path()` for a single path). Example target: `https://example.com/tools`.

## 2. Configure the project

Create `exoframe.json` like the following:

```json title="exoframe.json"
{
  "name": "tools-ui",
  "domain": "Host(`example.com`) && PathPrefix(`/tools`)",
  "labels": {
    "traefik.http.middlewares.tools-strip.stripprefix.prefixes": "/tools",
    "traefik.http.routers.tools.middlewares": "tools-strip"
  },
  "env": {
    "API_BASE": "https://api.example.com"
  }
}
```

- The `domain` field now contains the full Traefik rule.
- The `stripprefix` middleware removes `/tools` before requests hit your service. Rename the middleware if you already have a global one.
- If you want the backend to keep the prefix, skip the `labels` block.

## 3. Deploy and test

1. `exoframe deploy`
2. Visit `https://example.com/tools` to ensure the UI loads.
3. Optionally confirm the middleware is applied by checking request logs - the incoming path should arrive without `/tools`.

To host multiple apps under different prefixes, repeat the process with unique router and middleware names.
