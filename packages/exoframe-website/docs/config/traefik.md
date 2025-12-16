---
sidebar_position: 4
---

# Traefik Configuration

Exoframe allows you to override Traefik configuration by editing `~/.config/exoframe/traefik/traefik.yml`.
Top-level properties from this file will override the default Exoframe config.
The default config looks like this:

```yml
log:
  level: warning
  filePath: /var/traefik/traefik.log
entryPoints:
  web:
    address: ':80'
providers:
  docker:
    endpoint: unix:///var/run/docker.sock
    exposedByDefault: false
```

You can check the resulting config by inspecting `~/.config/exoframe/.internal/traefik/traefik.yml`.
Editing requires the removal of the Traefik instance and a restart of the Exoframe Server so that it can generate a new Traefik config.

## Enabling Traefik Dashboard

1. Edit the Traefik config in `~/.config/exoframe/traefik/traefik.yml` and add the following to it:

```yml
api:
  dashboard: true
```

2. Add the following labels to your Exoframe Server (or any other new deployment):

```bash
--label "traefik.http.routers.api.rule=Host(`traefik.your.host`)"
--label traefik.http.routers.api.service=api@internal
```

_Caveat_: Adding the aforementioned labels to Traefik itself does not seem to work for some reason. It is recommended to add them to the Exoframe Server or any other deployments you have.
