---
sidebar_position: 4
---

# Deploying App + Database Separately

When a project includes stateful dependencies (databases, caches, queues), deploy them as their own Exoframe services. That way, you can redeploy your app without restarting the database, and version each component independently.

## 1. Create a database deployment

1. Add a config file for the database, e.g. `infra/postgres.json`:

   ```json title="infra/postgres.json"
   {
     "name": "prod-postgres",
     "domain": false,
     "image": "postgres:15",
     "hostname": "prod-postgres",
     "volumes": ["prod_pg_data:/var/lib/postgresql/data"],
     "env": {
       "POSTGRES_PASSWORD": "@pg-password"
     },
     "restart": "unless-stopped"
   }
   ```

2. Deploy it once: `exoframe deploy -c infra/postgres.json`.

The database now runs as a long-lived container without any app code bundled in.

## 2. Describe the application deployment

Create `exoframe.json` for the app itself:

```json title="exoframe.json"
{
  "name": "prod-app",
  "domain": "app.example.com",
  "env": {
    "DATABASE_URL": "postgres://postgres:@prod-postgres:5432/appdb"
  },
  "project": "app-prod",
  "restart": "on-failure:3"
}
```

- The `DATABASE_URL` uses the database container’s hostname (`prod-postgres`) so traffic stays on the internal Docker network.
- Keep any other infra services (Redis, RabbitMQ, etc.) described in their own configs the same way as the database example.

## 3. Deploy and iterate independently

1. Deploy the application: `exoframe deploy`.
2. Verify both services are healthy: `exoframe ls`.
3. When you need to roll out app changes, redeploy only the app; the database keeps running unharmed.
4. Only redeploy the database config when changing the image version or environment.

This pattern keeps deployments faster, avoids unnecessary downtime for stateful services, and mirrors how Exoframe v7 is designed to manage multi-container systems.
