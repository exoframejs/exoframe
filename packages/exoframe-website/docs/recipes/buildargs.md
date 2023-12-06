---
sidebar_position: 1
---

# Using Docker Build Arguments

Sometimes, you might need to pass dynamic variables to your project during build time.
One way to achieve this is through [Docker build arguments](https://docs.docker.com/build/guide/build-args/).

Exoframe supports passing build arguments via the project config.

The example below demonstrates the use of build args with a custom Dockerfile to build a Next.js project.
For a complete Dockerfile example, refer to the [Next.js docs](https://nextjs.org/docs/pages/building-your-application/deploying#docker-image).

**Dockerfile:**

```Dockerfile
# ... copy values from args to env vars so that Next.js can use them
ARG GRAPHQL_URL=http://default.endpoint.com/v1
ENV NEXT_PUBLIC_GRAPHQL_ENDPOINT=${GRAPHQL_URL}
ARG SECRET_KEY
ENV SECRET_KEY=${SECRET_KEY}

# build app
RUN npm run build

# ... rest of Dockerfile
```

**Exoframe Project Config:**

```json
{
  "name": "example-buildargs-project",
  "buildargs": {
    "GRAPHQL_URL": "https://graphql.endpoint.com/v1",
    "SECRET_KEY": "@my-secret"
  }
}
```
