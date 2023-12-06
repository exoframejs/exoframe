---
sidebar_position: 2
---

# Server Configuration

Exoframe stores its configuration in `~/.config/exoframe/server.config.yml`. Currently, it contains the following settings:

```yaml
# Whether debug mode is enabled, default "false"
debug: false

# Whether to enable Let's Encrypt, default "false"
letsencrypt: false

# Email used for Let's Encrypt
letsencryptEmail: your@email.com

# Whether to apply gzip compression, default "true"
compress: true

# Whether to execute Docker prune for images and volumes, default "false"
autoprune: false

# Base top-level domain to use for deployments without domains specified, default "false"
# Used as postfix, e.g., if you specify ".example.com" (dot is auto-prepended if not present)
# All your deployments will be auto-deployed as "deployment-id.example.com"
baseDomain: false

# CORS support; can be "true" ("*" header) or an object with the "origin" property, default "false"
cors: false

# Server image update channel; can be "stable" or "nightly", default "stable"
updateChannel: 'stable'

# Traefik image to be used; set to "false" to disable Traefik management, default "traefik:latest"
traefikImage: 'traefik:latest'

# Traefik container name, default "exoframe-traefik"
traefikName: 'exoframe-traefik'

# Whether to disable auto-generation of initial Traefik config
traefikDisableGeneratedConfig: false

# Additional Traefik labels, default: {}
traefikLabels:
  - traefik.http.routers.api.rule: Host(`traefik.exoframe.your-host.com`)
  - traefik.http.routers.api.service: api@internal

# Network used by Traefik to connect services, default "exoframe"
exoframeNetwork: 'exoframe'

# Path to the folder with authorized_keys, default "~/.ssh"
publicKeysPath: '/path/to/your/public/keys'
```

**Warning:** Most changes to the config are applied immediately, with the exception of Let's Encrypt config. If you enable Let's Encrypt after the Traefik instance has started, you'll need to remove Traefik and then restart the Exoframe server for changes to take effect.
