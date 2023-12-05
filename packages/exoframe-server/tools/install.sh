#!/bin/bash

# Check if XDG_CONFIG_HOME is set, otherwise use default
if [ -z "$XDG_CONFIG_HOME" ]; then
    config_dir="$HOME/.config"
else
    config_dir="$XDG_CONFIG_HOME"
fi

FILE=$config_dir/exoframe/server.config.yml
DRY_RUN=0
ssl=false
INTERACTIVE=true

usage()
{
    echo
    echo "Usage:"
    echo "  -D, --dry-run     Dry run. Print command instead of executing it."
    echo "  -e, --email       Enter email to enable SSL support."
    echo "  -d, --domain      * Enter exoframe-server domain."
    echo "  -p, --password    * Enter your private key used for JWT encryption."
    echo
}

while [ "$1" != "" ]; do
    case $1 in
        -D | --dry-run )
            DRY_RUN=1
            ;;
        -e | --email ) shift
            ssl=$1
            ;;
        -d | --domain ) shift
            domain=$1
            ;;
        -p | --password ) shift
            passvar=$1
            ;;
        -h | --help )
            usage
            exit
            ;;
        * )
            usage
            exit 1
            ;;
    esac
    INTERACTIVE=false
    shift
done

if [ ! $domain ] && [ $INTERACTIVE = true ]; then
    read -p "Enter exoframe-server domain: " domain
fi
if [ ! -f "$FILE" ] && [ $ssl = false ] && [ $INTERACTIVE = true ]; then
    read -p "Enter email to enable SSL support: " ssl
fi
if [ ! $passvar ] && [ $INTERACTIVE = true ]; then
    read -sp "Enter your private key used for JWT encryption: " passvar
fi

if [ $INTERACTIVE = false ] && ([ ! $passvar ] || [ ! $domain ]); then
    echo "Required params are missing"
    usage
    exit 1
fi

VAR="docker run -d \
-v /var/run/docker.sock:/var/run/docker.sock \
-v $config_dir/exoframe:/root/.exoframe \
-v $HOME/.ssh/authorized_keys:/root/.ssh/authorized_keys:ro \
-e EXO_PRIVATE_KEY=$passvar \
--label traefik.enable=true \
--label traefik.http.routers.exoframe-server.rule=Host(\`$domain\`)"

if [ $ssl ] && [ $ssl != false ]; then
    if [ $DRY_RUN -eq 0 ]; then
        mkdir -p $(dirname $FILE) && touch $FILE
        echo "letsencrypt: true" >> $FILE
        echo "letsencryptEmail: $ssl" >> $FILE
    fi
    VAR+=" \
--label traefik.http.routers.exoframe-server-web.rule=Host(\`$domain\`) \
--label traefik.http.routers.exoframe-server.tls.certresolver=exoframeChallenge \
--label traefik.http.middlewares.exoframe-server-redirect.redirectscheme.scheme=https \
--label traefik.http.routers.exoframe-server-web.entrypoints=web \
--label traefik.http.routers.exoframe-server-web.middlewares=exoframe-server-redirect@docker \
--label traefik.http.routers.exoframe-server.entrypoints=websecure \
--label entryPoints.web.address=:80 \
--label entryPoints.websecure.address=:443"
fi

VAR+=" \
--restart always \
--name exoframe-server \
exoframe/server"

if [ $DRY_RUN -eq 1 ]; then
    echo
    echo "Commands to run inside server:"
    if [ $ssl ] && [ $ssl != false ]; then
        echo
        echo "mkdir -p $(dirname $FILE) && touch $FILE"
        echo "echo \"letsencrypt: true\" >> $FILE"
        echo "echo \"letsencryptEmail: $ssl\" >> $FILE"
        echo
    fi
    echo
    echo "$VAR"
else
    $VAR | (echo && echo && echo "$VAR" && echo)
fi
