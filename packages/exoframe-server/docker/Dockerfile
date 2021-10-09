FROM node:12.15-alpine

# install docker-compose
RUN apk update \
  && apk add --no-cache py-pip python-dev \
  libffi-dev openssl-dev gcc libc-dev make \
  && pip install docker-compose

# create new workdir
WORKDIR /app

# copy source
COPY bin/ /app

# set environment to production
ENV NODE_ENV production

# expose ports
EXPOSE 8080

# set binary as entry point
CMD ["node", "exoframe-server.js"]
