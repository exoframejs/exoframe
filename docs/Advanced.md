# Advanced topics

## Routing requests to specific path

Since Traefik supports routing requests to specific path, you can also do that with Exoframe.  
By default, Exoframe generates the following frontend string:

```js
Labels['traefik.frontend.rule'] = `Host:${config.domain}`; // where config is project config json
```

You can route requests to path instead by using Traefik [frontend matchers](https://docs.traefik.io/basics/#matchers) and appending them to `domain` field in config.
For example, you can route requests from `http://bots.domain.com/myhook` to your service.  
To achieve this, you will need to simply set `domain` field in the config file to `bots.domain.com;Path:/myhook`.
This will route all requests from `bots.domain.com/myhook` to `your.service.host/myhook`.

Here's a few examples of basic use cases:

| Domain string                     | Routed path         | Notes                                                                   |
| --------------------------------- | ------------------- | ----------------------------------------------------------------------- |
| `domain.com;Path:/products/`      | `service/products/` | Match exact path                                                        |
| `domain.com;PathStrip:/products/` | `service/`          | Match exact path and strip off the path prior to forwarding the request |

For more info and options see the aforementioned [Traefik frontend matchers](https://docs.traefik.io/basics/#matchers) docs.
