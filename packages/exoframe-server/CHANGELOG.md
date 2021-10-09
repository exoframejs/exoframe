# 6.2.3 / 2020-06-15

- Map docker-compose label lists to object notation when supplied (thanks to Harjot1Singh)

# 6.2.2 / 2020-06-11

- Correctly include non-secure endpoint into traefik config when using letsencrypt

# 6.2.1 / 2020-06-11

- Keep the restart policy after container update

# 6.2.0 / 2020-05-11

- Add autoprune config to execute prune after deployments if enabled
- Add basic system prune endpoint
- Add server install script (thanks to FDiskas)
- Added possibility to customize traefik config (thanks to anbraten)

# 6.1.0 / 2020-02-12

- Allow using custom traefik middlewares from exoframe config
- Add version label to docker images
- Update node.js to v12.15
- Update dependencies
- Use npm instead of yarn for repo

# 6.0.2 / 2019-11-05

Fixes:

- Fix http to https redirect logic (harder than it seems :| )

# 6.0.1 / 2019-11-05

Fixes:

- Correctly redirect http to https when using letsencrypt

# 6.0.0 / 2019-11-05

Breaking changes:

- Exoframe server has been updated to work with Traefik v2.0

Additions:

- Config command now includes additional port, compess and letsencrypt settings
- Allow disabling letsencrypt on inidividual deployments

Fixes:

- Use server volume for traefik config mapping when running in docker

For migration guide see [Exoframe CLI Changelog](https://github.com/exoframejs/exoframe/blob/master/CHANGELOG.md#600--2019-11-05)

# 5.0.4 / 2019-08-28

- Pin traefik to v1.7.x
- Execute 'npm build' in default node template if present

# 5.0.3 / 2019-07-29

- Correctly cleanup old containers on deployment update (https://github.com/exoframejs/exoframe/issues/253)

# 5.0.2 / 2019-07-19

- Fix build process for newer ncc versions

# 5.0.1 / 2019-07-17

- Update node.js to v12.6 in dockerfile

# 5.0.0 / 2019-07-17

Additions:

- Add function deployments
- Add linting, npm scripts and run it in travis

Changes:

- Use node 12 as lowest required version
- Remove pkg and use node:alpine base for resulting image

Fixes:

- Rename nginx template to static template
- Show warning instead of error when user config does not exist

# 4.1.2 / 2019-05-14

- Fix traefik version fetching for new versions of traefik images
- Fix compose install in Dockerfile
- Correctly throw errors when docker-compose fails
- Correctly throw error when template wasn't found

# 4.1.1 / 2019-03-31

- Fix debug docker images, correctly include home html

# 4.1.0 / 2019-03-27

Additions:

- Pass env vars (including secrets) to docker-compose

# 4.0.3 / 2019-02-14

- Fix home html page inclusion into pkg bundle

# 4.0.2 / 2019-02-14

- Fix home html page inclusion into bundle

# 4.0.0 / 2019-02-12

BREAKING CHANGES:

- Docker Swarm support is now a plugin (see [plugin docs](https://github.com/exoframejs/exoframe-plugin-swarm) for more info)

Additions:

- Add plugins support
- Add method to get secret value
- Add way to get exoframe-server logs
- Add support for volumes for deployments
- Add way to deploy projects from image and image tar file
- Expose deployment labels using env vars
- Add debug docker image build that uses node and js code as base
- Add exoframe-server npm package binary, you can now `npm install exoframe-server`

Changes:

- Merge all networks from compose file during deployment
- Use unique folders for each deployemnt to allow parallel deployments

Fixes:

- Use project base name for compose deployments to prevent overwriting

# 3.3.0 / 2018-12-13

- Add basic secrets implementation

# 3.2.1 / 2018-12-10

- Mock github API to evade issues with rate-limits in CI

# 3.2.0 / 2018-12-10

- Moved server docs to main repo
- Added support for frontend basic auth

# 3.1.0 / 2018-09-19

- Better checks for compose version in template for swarm
- Better container cleanup for non-swarm deployments
- Handle option to follow logs in normal and swarm modes
- Add rate-limit support
- Catch errors in version method
- Better explanation and example for EXO_PRIVATE_KEY
- Change response code for pubkey not found error
- Do not attempt to detect errors in build log
- Update pkg binaries to latest available node v8.11.3 version

# 3.0.1 / 2018-07-09

Fixes:

- Do not attempt to join swarm network if not running in swarm
- Always append 'traefik.enabled=true' to service docker labels

# 3.0.0 / 2018-05-23

Additions:

- Add complex recipes support
- Add swarm mode support

# 2.0.2 / 2018-01-26

Fixes:

- Auto-prepend dot to baseDomain if it's not present & better document baseDomain usage
- Construct unique deployments backend strings to fix loadbalancing for unique deployments

# 2.0.1 / 2018-01-24

Fixes:

- Hotfix for fastify binding address

# 2.0.0 / 2018-01-24

Additions:

- Add 3rd party templates support
- Add CORS support that can be enabled via config
- Add way to update to nightly builds
- Allow specifying project template using config file
- Allow configuring Traefik via server config

Changes:

- Rebuild docker-compose services on deployment
- Replace tap with jest and better parallelized tests
- Replace hapi with fastify

Fixes:

- Use Traefik 1.5.0 acme HTTP challenge due to changes to letsencrypt
- Kill self on update on next tick and increase delay to prevent internal errors

# 1.1.2 / 2017-12-29

Fixes:

- Fix server update test, correctly remove traefik when it is stopped

# 1.1.1 / 2017-12-11

Fixes:

- Use after_script in travis so that it fails on build failures
- Use node 8 in travis
- Fix build issue with using spread, update to node 8.9.0 for pkg

# 1.1.0 / 2017-12-11

Additions:

- Allow specifying custom labels via project config (thanks FWeinb)

Changes:

- Update dependency versions

# 1.0.1 / 2017-10-30

Changes:

- Add Greenkeeper to keep dependencies updated
- Update dependencies

# 1.0.0 / 2017-10-19

First "production ready" release!

Changes:

- Adjust working in readme
- Simplify readme since most docs are now in exoframe cli repo

# 0.22.1 / 2017-10-11

Changes:

- Use Node v8.6.0 for build in pkg
- Update dependencies

# 0.22.0 / 2017-10-04

Additions:

- Add basic deployment token management

# 0.21.0 / 2017-09-28

Additions:

- Add way to enable/disable gzip compression in traefik

# 0.20.1 / 2017-09-22

Fixes:

- Fix for node.js reporting optional deps install as failures

# 0.20.0 / 2017-09-20

Changes:

- Use stream for deploy route response to provide more info for client

# 0.19.0 / 2017-09-18

Additions:

- Add route that gets and displays current and latest versions of server and traefik

# 0.18.1 / 2017-09-15

Fixes:

- Fix server self update, add slight delay upon sending response to make time for it to finish

# 0.18.0 / 2017-09-15

Additions:

- Always pull base image during build

Changes:

- Use node:latest base image for node.js projects

# 0.17.1 / 2017-09-13

Fixes:

- Clean docker images in travis after tests finish to fix wrong image getting pushed

# 0.17.0 / 2017-09-13

Additions:

- Add update endpoint that can update traefik and self

# 0.16.0 / 2017-08-28

Additions:

- Return build log on image build failures during deployment

# 0.15.0 / 2017-08-03

Additions:

- Implement basic deployment update functionality

# 0.14.0 / 2017-08-02

Additions:

- Add simple way to generate deploy tokens

# 0.13.1 / 2017-08-02

Fixes:

- Use node8-alpine during pkg build since latest-alpine might fail

# 0.13.0 / 2017-08-02

Additions:

- Allow disabling domain with false value in config
- Allow specifying project name using config file
- Allow getting logs for whole projects, not just single deployments

# 0.12.0 / 2017-07-31

Additions:

- Add exoframe.project labels to deployments to allow grouping them
- Allow removing whole projects

# 0.11.1 / 2017-07-17

Fixes:

- Bundle docker-compose into dockerfile to fix standalone compose deployments

# 0.11.0 / 2017-07-17

Additions:

- Better docs

# 0.10.6 / 2017-07-06

Fixes:

- Fix verification with malformed keys

# 0.10.5 / 2017-07-06

Fixes:

- Fix template packaging

# 0.10.4 / 2017-07-06

Additions:

- Add home route that links to github

Fixes:

- Fix HTTPS traefik deployment

# 0.10.3 / 2017-07-06

Changes:

- Autoredirect http to https in Traefik
- Add default entry points configs for Traefik

# 0.10.2 / 2017-07-06

Fixes:

- Fix login double-reply issue

# 0.10.1 / 2017-06-29

Changes:

- Replace gitlab-ci with travis

Fixes:

- Fix node dockerfile and use npm to start app

# 0.10.0 / 2017-06-28

Changes:

- Use private-public RSA key pairs instead of plain-text credentials for auth

Fixes:

- Only use yarn for node projects if yarn.lock is present

# 0.9.0 / 2017-05-20

Additions:

- Allow enabling autoconstructed domains for deployments
- Allow specifying internal hostnames for deployments

Changes:

- Get all containers for all commands
- Change list output to include extended deployment info
- Return extended info for deployments
- Set NODE_ENV to production within docker

Fixes:

- Only stop non-running containers during remove

# 0.8.1 / 2017-05-18

Fixes:

- Fix issue when removing/getting logs for nonexistent deployments
- Fix on-failure restart policy parsing

# 0.8.0 / 2017-05-18

Additions:

- Use on-failure restart policy instead of always one
- Add method to get logs and tests for it
- Use gitlab-ci to build slim pkg based docker images, closes #3

Changes:

- Replace travis-ci with gitlab-ci
- Clarify deployment arguments in README
- Use node:alpine as base image

Fixes:

- Only append non-empty messages to build log

# 0.7.0 / 2017-05-17

Full rewrite, beta version.

- Simplified deployment procedure
- Autoconfigurable Traefik reverse-proxy
- Docker-compose support
- Letsencrypt support

  # 0.6.0 / 2016-09-16

Additions:

- Add clean method that removes all untagged docker images
- Add method to remove images
- Add method to inspect containers
- Add method to start containers
- Add method to get container logs
- Add unit tests and test coverage

Changes:

- Enforce current user info during build
- Better build test completion validation

Fixes:

- Do not build without tag, correctly catch issues with parsing of labels during build

# 0.5.0 / 2016-09-08

- Filter out non-named images for deploy
- Add way to link containers during deployment

# 0.4.0 / 2016-09-05

Additions:

- Allow pulling and listing images from registries
- Allow stopping and removing containers

Fixes:

- Expose ports during deploy to forward them correctly
- Correctly handle deployment of registry images
