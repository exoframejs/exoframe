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

## Rate limiting

Exoframe allows you to enable basic IP-based rate-limiting integrated into Traefik.  
To do that, simply specify the following fields in the project config file:

```json
{
  // adding this object will enable IP-based rate-limiting
  "rate-limit": {
    // time period to be considered for request limits
    // defaults to "1s" if not specified
    "period": "3s",
    // average request rate over given time period
    // defaults to 1 if not specified
    "average": 5,
    // maximal burst request rate over given time period
    // defaults to 5 if not specified
    "burst": 10
  }
}
```

This will define how many requests (`average`) over given time (`period`) can be performed from one IP address.
For the example above - an average of 5 requests every 3 seconds is allowed with busts of up to 10 requests.

For more information, see [Traefik rate-limiting docs](https://docs.traefik.io/configuration/commons/#rate-limiting).

## Secrets

Exoframe allows you to create server-side secret values that can be used during service deployments.
To use secrets you first need to create one. This can be done by running:

```
$ exoframe secret new
```

Once you specify the name and value, Exoframe server will create new secret _for your current user_.
After creation the secret can be used in `exoframe.json` config file by using secret name and prefixing it with `@`, like so (in this example the secret was name `my-secret`):

```json
"env": {
  "SECRET_KEY": "@my-secret"
},
```

Current caveats:

- Currently secrets only work for environment variables
- Currently secrets work only for normal deployments (any template or recipe that uses `startFromParams` won't have secrets expanded)

## Plugins

Exoframe-Server supports extension of core features using plugins.  
Plugins are installed and loaded automatically once corresponding config is added to [server configuration](ServerConfiguration.md).  
Refer to specific plugins docs to see how to configure them.
