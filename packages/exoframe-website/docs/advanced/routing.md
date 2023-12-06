---
sidebar_position: 2
---

# Routing Requests to a Specific Path

Since Traefik supports routing requests to a specific path, you can achieve the same with Exoframe.

By default, Exoframe generates the following frontend string:

```js
// where config is the project config JSON
Labels[`traefik.http.routers.${name}.rule`] = config.domain.includes('Host(')
  ? // if the string already contains Host() - use it as is
    config.domain
  : // otherwise - wrap it into Host()
    `Host(\`${config.domain}\`)`;
```

To route requests to a specific path, use Traefik [router rules](https://docs.traefik.io/routing/routers/#rule) and include them inside the `domain` field in the config. For instance, to route requests from `http://bots.domain.com/myhook` to your service, set the `domain` field in the config file to ``Host(`bots.domain.com`) && Path(`/myhook`)``. This will route all requests from `bots.domain.com/myhook` to `your.service.host/myhook`.

If you need to strip or replace the path, provide an additional label for Traefik. For example, the following config will route `domain.com/myprefix` to `your.service.host`:

```json
{
  "domain": "Host(`domain.com`) && Path(`/myprefix`)",
  "labels": {
    "traefik.http.middlewares.test-stripprefix.stripprefix.prefixes": "/myprefix"
  }
}
```

For more information and options, refer to the Traefik [router rules](https://docs.traefik.io/routing/routers/#rule) as well as the [middlewares](https://docs.traefik.io/middlewares/overview/) documentation.
