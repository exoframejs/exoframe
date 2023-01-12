FROM node:18-alpine

# create new workdir
WORKDIR /app

# create default folder for config and logs
RUN mkdir -p /root/.config/exoframe/exoframe-server

# Install app dependencies
COPY package*.json ./
RUN npm install

# copy source
COPY . /app

# set environment to production
ENV NODE_ENV production

# expose ports
EXPOSE 8080

# set binary as entry point
CMD ["node", "bin/exoframe-server.js"]
