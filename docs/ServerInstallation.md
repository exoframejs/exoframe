# Exoframe Server

## Installation and Usage

1.  Make sure you have Docker [installed and running](https://docs.docker.com/engine/installation/) on your host.
2.  Pull and run Exoframe server using docker:

```sh
docker run -d \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /path/to/exoframe-folder:/root/.exoframe \
  -v /home/user/.ssh/authorized_keys:/root/.ssh/authorized_keys:ro \
  -e EXO_PRIVATE_KEY=your_private_key \
  --label traefik.backend=exoframe-server \
  --label traefik.frontend.rule=Host:exoframe.your-host.com \
  --restart always \
  --name exoframe-server \
  exoframe/server

# Explanation for arguments:
# this allows Exoframe to access your docker
-v /var/run/docker.sock:/var/run/docker.sock

# /path/to/exoframe-folder should be path on your server
# to desired folder that'll hold Exoframe configs
-v /path/to/exoframe-folder:/root/.exoframe

# /home/user/.ssh/authorized_keys should point to your authorized_keys file
# for SSH that holds allowed public keys
-v /home/user/.ssh/authorized_keys:/root/.ssh/authorized_keys:ro

# this is your private key used for JWT encryption
-e EXO_PRIVATE_KEY=your_jwt_encryption_key

# this is used to tell traefik to which deployment current docker service belongs
--label traefik.backend=exoframe-server

# this is used to tell traefik on which domain should Exoframe server be listening
--label traefik.frontend.rule=Host:exoframe.your-host.com
```

3.  Edit config file to fit your needs (see section below)

Then install [Exoframe CLI](https://github.com/exoframejs/exoframe), point it to your new Exoframe server and use it.

## Installation and usage in Swarm mode

Exoframe also supports running in [Swarm mode](https://docs.docker.com/engine/swarm/).  
To run Exoframe server in swarm, you need to do the following:

1.  Make sure you have Docker on your host.
2.  Make sure your Docker has [Swarm mode enabled](https://docs.docker.com/engine/swarm/swarm-tutorial/create-swarm/).
3.  Pull and run Exoframe server using Docker on your manager node:

```
docker service create \
  --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
  --mount type=bind,source=/path/to/exoframe-folder,target=/root/.exoframe \
  --mount type=bind,source=/home/user/.ssh/authorized_keys,target=/root/.ssh/authorized_keys,readonly \
  -e EXO_PRIVATE_KEY=your_private_key \
  --label traefik.backend=exoframe-server \
  --label traefik.frontend.rule=Host:exoframe.your-host.com \
  --label traefik.port=8080 \
  --constraint=node.role==manager \
  --name exoframe-server \
  exoframe/server
```

Note that both Exoframe server and Traefik will be run on your manager node.
