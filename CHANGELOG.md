# 6.1.4 / 2020-05-08

- Fix for .exoframeignore handling on Windows

# 6.1.3 / 2020-04-16

- Figuring out github action releases :)

# 6.1.2 / 2020-04-16

- Replace travis with github actions
- Update dependencies to latest versions

# 6.1.1 / 2020-04-16

- Fix error handling during deployment when no response is returned

# 6.1.0 / 2020-02-12

- Add custom traefik middleware usage via labels and config
- Better docs for HTTPS server setup

# 6.0.2 / 2020-02-05

- Maintenance release with updated dependencies

# 6.0.1 / 2019-11-07

Fixes:

- Fix completion target by using custom command

Changes:

- Use ncc to build smaller release bundle

# 6.0.0 / 2019-11-05

Breaking changes:

- Exoframe has been updated to work with Traefik v2.0

Additions:

- Config command now includes additional port, compess and letsencrypt settings

## Migrating to v6.0

In the majority of cases the migration path is pretty straightforward (albeit slightly painful):

1. Stop and remove current version of Exoframe Server and Traefik
2. Pull latest version of Exoframe Server and start it with new config
3. Re-deploy all of your current deployments to update labels to fit Traefik v2.0 (this is the largest step, but there's no way around it)

Things to keep in mind:

- v6.0 is not backwards compatible with your current deployments, so once you update the server - **current deployments will stop working**
- Exoframe Server now requires a additional labels to correctly work with letsencrypt
- Hosts can no longer be specified as list, i.e. instead of this:

  ```json
  {"domain": "exynize.net, exynize.org, exynize.com"}
  ```

  you will now need to do this:

  ```js
  {"domain": "Host(`exynize.net`, `exynize.org`, `exynize.com`)"}
  ```

# 5.2.1 / 2019-09-30

Fixes:

- Mark upgrade flag as boolean to prevent it from eating following args

# 5.2.0 / 2019-08-21

Additions:

- Allow specifying endpoint as a deploy command flag

# 5.1.0 / 2019-07-22

Additions:

- Allow specifying alternate config file during deployment
- Allow non-interactive secret manipulation
- Allow non-interactive config manipulation
- Allow using `exoframe rm` with deploy token
- Allow removing deployments using URL

# 5.0.0 / 2019-07-17

Additions:

- Add function deployments

Changes:

- Document env vars usage in docker-compose
- Exit with non-zero code when deployment fails
- Add linting npm scripts and run it in travis

# 4.0.1 / 2019-05-07

- Use node 10.x for pkg and travis
- Update dependencies to latest versions
- Add some docs about docker-compose and Traefik rules
- Doc typos and syntax fixes

# 4.0.0 / 2019-02-12

BREAKING CHANGES:

- Docker Swarm support on server is now a plugin (see [plugin docs](https://github.com/exoframejs/exoframe-plugin-swarm) for more info)

Additions:

- Add plugins support
- Add method to get secret value
- Add way to get exoframe-server logs
- Add support for volumes for deployments
- Add way to deploy projects from image and image tar file

Changes:

- Multiple documentation improvements

# 3.3.0 / 2018-12-13

- Add basic secrets support and docs

# 3.2.0 / 2018-12-10

Additions:

- Added support for basic http auth

Changes:

- Moved server docs to main repo

Fixes:

- Fixed rateLimit field wrong format in config docs

# 3.1.1 / 2018-09-19

- Update npm deploy token for travis

# 3.1.0 / 2018-09-19

- Add option to follow logs
- Better parameter validation for interactive config
- Indicate upload and deployment stages
- Add basic IP-based rate-limit support
- Update pkg binaries to latest available node v8.11.3 version

# 3.0.0 / 2018-05-23

Additions:

- Add tutorial on running Exoframe on basic AWS-based swarm cluster
- Add complex recipes support
- Add swarm support
- Add config alias (`exoframe init`)

# 2.1.1 / 2018-03-16

Fixes:

- Aggregate service aliases from all networks to fix service listing

# 2.1.0 / 2018-02-28

Additions:

- Add support for .exoframeignore
- Login command now accepts an endpoint as an optional argument
- Add logo

Changes:

- Update dependencies

# 2.0.1 / 2018-01-24

Additions:

- Add 3rd party templates support
- Allow setting project template using config command
- Add way to set labels via config command

Changes:

- Replace tap with jest and better parallelized tests
- Switch to snapshot testing for logs output

Fixes:

- Make cli work with Exoframe server 2.0 backed by fastify

# 1.0.4 / 2017-11-30

- Fix npm autorelease by switching to token that does not require OTP

# 1.0.3 / 2017-11-30

Fixes:

- Update npm api key for travis-ci to fix autobuilds

# 1.0.2 / 2017-11-30

Changes

- Validate project name in config before deployment
- Update dependencies
- Update pkg binaries to latest available node v8.6.0 version

# 1.0.1 / 2017-10-30

Changes:

- Add greenkeeper to maintain dependencies up to date
- Update dependencies

# 1.0.0 / 2017-10-19

First "production ready" release!

Additions:

- Clarify node.js projects deployment in docs
- Add list of features to readme
- Restructure docs, add basic contribution guide
- Document basic requirements for Exoframe usage and OOM build issue

# 0.23.0 / 2017-10-18

Additions:

- Ask if user wants to execute update immediately when available

# 0.22.0 / 2017-10-04

Additions:

- Add basic deployment token management

Fixes:

- Improve "remove" method test code coverage

# 0.21.1 / 2017-09-20

Fixes:

- Use highland.js to correctly parse streamed server response

# 0.21.0 / 2017-09-20

Additions:

- Add support for streamed response from server for more verbosity
- Document new update and rm-endpoint commands

Changes:

- Change readme to reflect usage of node:latest

# 0.20.0 / 2017-09-18

Additions:

- Add way to check for server and traefik updates
- Add rm-endpoint command to remove existing endpoints

# 0.19.2 / 2017-09-16

Additions:

- Add verbose output for deployment

Fixes:

- Correctly handle empty response from server

# 0.19.1 / 2017-09-15

Fixes:

- Fix for malformed JSON parsing during deployment

# 0.19.0 / 2017-09-13

Additions:

- Add notifications about available cli updates
- Add update server target
- Add update traefik command

Changes:

- Mention pre-packaged binaries in readme

# 0.18.2 / 2017-09-01

Fixes:

- Tweak github deployment, disable cleanup to leave built files in place

# 0.18.1 / 2017-09-01

Additions:

- Setup autobuild of pre-packaged binaries using pkg

# 0.18.0 / 2017-08-28

Additions:

- Display build log after deployment failures
- Use travis to autopublish new versions from tags

# 0.17.1 / 2017-08-25

Additions:

- Add test for url opening during deployment
- Add docs section for articles, videos, links

Changes:

- Replace open with opn

Fixes:

- Fix eslint errors
- Correctly handle opening multiple domains on deploy

# 0.17.0 / 2017-08-22

Additions:

- Added option to open domain in browser after deploy or update

Fixes:

- Fix minimum required version in readme

# 0.16.1 / 2017-08-22

Fixes:

- Use null instead of undefined values to fix config yaml issue

# 0.16.0 / 2017-08-03

Additions:

- Add deployment updates and docs for it
- Add basic support for multiple endpoints
- Add descriptions to all options for better help

Changes:

- Use unified service formatting function, fixes #50

# 0.15.0 / 2017-08-02

Additions:

- Add support for deployment tokens

Changes:

- Use package.json for version in yargs

Fixes:

- Check if path exists before running deploy, fixes #47

# 0.14.0 / 2017-08-02

Additions:

- Allow specifying project name using config command
- Allow getting logs for whole projects, not just single deployments
- Describe deployment and project concepts in docs

Fixes:

- Do not prepend http:// to listed domains

# 0.13.0 / 2017-07-31

Additions:

- Create docs folder, add FAQ and clarify username usage, closes #35

Changes:

- Group deployments by projects
- Display thrown errors where applicable

# 0.12.0 / 2017-07-24

Changes:

- Change config method to edit existing config file

Fixes:

- Fail early if the configuration is invalid JSON

# 0.11.1 / 2017-07-18

Fixes:

- Do not filter passphrase input during login to allow for empty passphrases
- Fix config file JSON formatting in README

# 0.11.0 / 2017-07-17

Additions:

- Add command to generate project config file

Fixes:

- Describe config file in docs

# 0.10.1 / 2017-06-29

Changes:

- Replace gitlab-ci with travis

Fixes:

- Fix issue with absent .ssh folder in userdir

# 0.10.0 / 2017-06-28

Changes:

- Update login to use new private-public key auth
- Update dependencies and fix tests

Fixes:

- Fix issue when no hostname is set during deployment

# 0.9.0 / 2017-05-20

Additions:

- Show extended info on deployment
- Show spinner during upload

Changes:

- Use new list response format
- Use table for better list output

Fixes:

- Fix logs parsing for lines without dates
- Generate dates for logs test on the fly to be independent of platform locale

# 0.8.1 / 2017-05-18

- Correctly handle not found responses for logs/remove requests

# 0.8.0 / 2017-05-18

Additions:

- Add logs command and tests for it, closes #24
- Allow deploying current folder without specifying path

# 0.7.0 / 2017-05-18

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

- Show shortened container ID after deploy

Fixes:

- Clean logs text before printing it out
- Fix var naming in logs method
- Fix error messages for remove command

# 0.5.1 / 2016-09-08

Fixes:

- Require authenticated user for most actions, fixes #1

# 0.5.0 / 2016-09-08

Additions:

- Add way to link containers during deployment
- Add nginx template as default one to config
- Add way to manually update installed plugins
- Ask about features user wants to use during deploy

Changes:

- Replace demo gif with asciinema link
- Update readme with current list of commands and default templates
- Change remove command to shorter rm

# 0.4.0 / 2016-09-05

Additions:

- Allow listing images that were fetched from repos
- Allow pulling images from remote registries
- Allow removing non-running services
- Allow stopping running services
- Allow to asking for separate lists of services and images, fix ports output in services

Changes:

- Ask for volumes in several inputs instead of comma separation
- Ask for env vars in several inputs instead of comma separation
- Ask for labels in several inputs instead of comma separation
- Ask for ports in several inputs instead of comma separation
- Ask for multiple values using sequential questions, not comma separated input during build

Fixes:

- Do not display unmapped ports
- Do not display images without tags in lists
