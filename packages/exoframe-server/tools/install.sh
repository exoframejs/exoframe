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
config_letsencrypt=""
config_letsencrypt_email=""

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

# load config values if present
if [ -f "$FILE" ]; then
    config_letsencrypt=$(grep -E '^letsencrypt:' "$FILE" | tail -n 1 | sed -E 's/letsencrypt:[[:space:]]*//' 2>/dev/null)
    config_letsencrypt_email=$(grep -E '^letsencryptEmail:' "$FILE" | tail -n 1 | sed -E 's/letsencryptEmail:[[:space:]]*//' 2>/dev/null)
    if [ "$ssl" = false ] && [ "$config_letsencrypt" = "true" ]; then
        ssl=$config_letsencrypt_email
        if [ "$ssl" = "" ]; then
            ssl=true
        fi
    fi
    if [ "$ssl" = false ] && [ "$config_letsencrypt_email" != "" ]; then
        ssl=$config_letsencrypt_email
    fi
fi

if [ -z "$domain" ] && [ "$INTERACTIVE" = true ]; then
    read -p "Enter exoframe-server domain: " domain
fi
if [ "$ssl" = false ] && [ "$INTERACTIVE" = true ]; then
    read -p "Enter email to enable SSL support: " ssl
fi
if [ -z "$passvar" ] && [ "$INTERACTIVE" = true ]; then
    read -sp "Enter your private key used for JWT encryption: " passvar
fi

if [ "$INTERACTIVE" = false ] && ([ -z "$passvar" ] || [ -z "$domain" ]); then
    echo "Required params are missing"
    usage
    exit 1
fi

ssl_email=""
if [ "$ssl" != false ] && [ "$ssl" != true ]; then
    ssl_email=$ssl
fi
needs_letsencrypt=false
needs_letsencrypt_email=false
if [ "$ssl" ] && [ "$ssl" != false ]; then
    if [ "$config_letsencrypt" != "true" ]; then
        needs_letsencrypt=true
    fi
    if [ "$ssl_email" != "" ] && [ "$config_letsencrypt_email" != "$ssl_email" ]; then
        needs_letsencrypt_email=true
    fi
fi

VAR="docker run -d \
-v /var/run/docker.sock:/var/run/docker.sock \
-v $config_dir/exoframe:/root/.config/exoframe \
-v $HOME/.ssh/authorized_keys:/root/.ssh/authorized_keys:ro \
-e EXO_PRIVATE_KEY=$passvar \
--label traefik.enable=true \
--label traefik.http.routers.exoframe-server.rule=Host(\`$domain\`)"

if [ "$ssl" ] && [ "$ssl" != false ]; then
    if [ $DRY_RUN -eq 0 ]; then
        if [ $needs_letsencrypt = true ] || [ $needs_letsencrypt_email = true ]; then
            mkdir -p $(dirname $FILE) && touch $FILE
            if [ $needs_letsencrypt = true ]; then
                echo "letsencrypt: true" >> $FILE
            fi
            if [ $needs_letsencrypt_email = true ]; then
                echo "letsencryptEmail: $ssl_email" >> $FILE
            fi
        fi
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
    if [ "$ssl" ] && [ "$ssl" != false ]; then
        echo
        if [ $needs_letsencrypt = true ] || [ $needs_letsencrypt_email = true ]; then
            echo "mkdir -p $(dirname $FILE) && touch $FILE"
            if [ $needs_letsencrypt = true ]; then
                echo "echo \"letsencrypt: true\" >> $FILE"
            fi
            if [ $needs_letsencrypt_email = true ]; then
                echo "echo \"letsencryptEmail: $ssl_email\" >> $FILE"
            fi
            echo
        fi
    fi
    echo
    echo "$VAR"
else
    $VAR | (echo && echo && echo "$VAR" && echo)
fi
