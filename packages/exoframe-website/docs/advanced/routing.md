---
sidebar_position: 2
---

# Routing requests to specific path

Since Traefik supports routing requests to specific path, you can also do that with Exoframe.  
By default, Exoframe generates the following frontend string:

```js
// where config is project config json
Labels[`traefik.http.routers.${name}.rule`] = config.domain.includes('Host(')
  ? // if string already contains Host() - use it as is
    config.domain
  : // otherwise - wrap it into Host()
    `Host(\`${config.domain}\`)`;
```

You can route requests to path instead by using Traefik [router rules](https://docs.traefik.io/routing/routers/#rule) and using them inside of `domain` field in config.
For example, you can route requests from `http://bots.domain.com/myhook` to your service.  
To achieve this, you will need to simply set `domain` field in the config file to ``Host(`bots.domain.com`) && Path(`/myhook`)``.
This will route all requests from `bots.domain.com/myhook` to `your.service.host/myhook`.

If you need to strip or replace path, you have to provide additional label for Traefik.
E.g. the following config will route `domain.com/myprefix` to `your.service.host`:

```json
{
  "domain": "Host(`domain.com`) && Path(`/myprefix`)",
  "labels": {
    "traefik.http.middlewares.test-stripprefix.stripprefix.prefixes": "/myprefix"
  }
}
```

For more info and options see the aforementioned Traefik [router rules](https://docs.traefik.io/routing/routers/#rule) as well as [middlewares](https://docs.traefik.io/middlewares/overview/) docs.
