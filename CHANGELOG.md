
0.21.1 / 2017-09-20
==================

Fixes:
  * Use highland.js to correctly parse streamed server response

0.21.0 / 2017-09-20
==================

Additions:
  * Add support for streamed response from server for more verbosity
  * Document new update and rm-endpoint commands

Changes:
  * Change readme to reflect usage of node:latest

0.20.0 / 2017-09-18
==================

Additions:
  * Add way to check for server and traefik updates
  * Add rm-endpoint command to remove existing endpoints

0.19.2 / 2017-09-16
==================

Additions:
  * Add verbose output for deployment

Fixes:
  * Correctly handle empty response from server

0.19.1 / 2017-09-15
==================

Fixes:
  * Fix for malformed JSON parsing during deployment

0.19.0 / 2017-09-13
==================

Additions:
  * Add notifications about available cli updates
  * Add update server target
  * Add update traefik command

Changes:
  * Mention pre-packaged binaries in readme

0.18.2 / 2017-09-01
==================

Fixes:
  * Tweak github deployment, disable cleanup to leave built files in place

0.18.1 / 2017-09-01
==================

Additions:
  * Setup autobuild of pre-packaged binaries using pkg

0.18.0 / 2017-08-28
==================

Additions:
  * Display build log after deployment failures
  * Use travis to autopublish new versions from tags

0.17.1 / 2017-08-25
==================

Additions:
  * Add test for url opening during deployment
  * Add docs section for articles, videos, links

Changes:
  * Replace open with opn

Fixes:
  * Fix eslint errors
  * Correctly handle opening multiple domains on deploy

0.17.0 / 2017-08-22
==================

Additions:
  * Added option to open domain in browser after deploy or update

Fixes:
  * Fix minimum required version in readme

0.16.1 / 2017-08-22
==================

Fixes:
  * Use null instead of undefined values to fix config yaml issue

0.16.0 / 2017-08-03
==================
  
Additions:
  * Add deployment updates and docs for it
  * Add basic support for multiple endpoints
  * Add descriptions to all options for better help

Changes:
  * Use unified service formatting function, fixes #50

0.15.0 / 2017-08-02
==================

Additions:
  * Add support for deployment tokens

Changes:
  * Use package.json for version in yargs

Fixes:
  * Check if path exists before running deploy, fixes #47

0.14.0 / 2017-08-02
==================

Additions:
  * Allow specifying project name using config command
  * Allow getting logs for whole projects, not just single deployments
  * Describe deployment and project concepts in docs

Fixes:
  * Do not prepend http:// to listed domains

0.13.0 / 2017-07-31
==================

Additions:
  * Create docs folder, add FAQ and clarify username usage, closes #35

Changes:
  * Group deployments by projects
  * Display thrown errors where applicable

0.12.0 / 2017-07-24
==================

Changes:
  * Change config method to edit existing config file

Fixes:
  * Fail early if the configuration is invalid JSON

0.11.1 / 2017-07-18
==================

Fixes:
  * Do not filter passphrase input during login to allow for empty passphrases
  * Fix config file JSON formatting in README

0.11.0 / 2017-07-17
==================

Additions:
  * Add command to generate project config file

Fixes:
  * Describe config file in docs

0.10.1 / 2017-06-29
==================

Changes:
  * Replace gitlab-ci with travis

Fixes:
  * Fix issue with absent .ssh folder in userdir

0.10.0 / 2017-06-28
==================

Changes:
  * Update login to use new private-public key auth
  * Update dependencies and fix tests

Fixes:
  * Fix issue when no hostname is set during deployment

0.9.0 / 2017-05-20
==================

Additions:
  * Show extended info on deployment
  * Show spinner during upload

Changes:
  * Use new list response format
  * Use table for better list output

Fixes:
  * Fix logs parsing for lines without dates
  * Generate dates for logs test on the fly to be independent of platform locale

0.8.1 / 2017-05-18
==================

  * Correctly handle not found responses for logs/remove requests

0.8.0 / 2017-05-18
==================

Additions:
  * Add logs command and tests for it, closes #24
  * Allow deploying current folder without specifying path

0.7.0 / 2017-05-18
==================

Full rewrite, beta version.

* Simplified deployment procedure
* Autoconfigurable Traefik reverse-proxy
* Docker-compose support
* Letsencrypt support


0.6.0 / 2016-09-16
==================

Additions:
  * Add clean method that removes all untagged docker images
  * Add method to remove images
  * Add method to inspect containers
  * Add method to start containers
  * Add method to get container logs
  * Add unit tests and test coverage

Changes:
  * Show shortened container ID after deploy

Fixes:
  * Clean logs text before printing it out
  * Fix var naming in logs method
  * Fix error messages for remove command

0.5.1 / 2016-09-08
==================

Fixes:
  * Require authenticated user for most actions, fixes #1

0.5.0 / 2016-09-08
==================

Additions:
  * Add way to link containers during deployment
  * Add nginx template as default one to config
  * Add way to manually update installed plugins
  * Ask about features user wants to use during deploy

Changes:
  * Replace demo gif with asciinema link
  * Update readme with current list of commands and default templates
  * Change remove command to shorter rm

0.4.0 / 2016-09-05
==================

Additions:
  * Allow listing images that were fetched from repos
  * Allow pulling images from remote registries
  * Allow removing non-running services
  * Allow stopping running services
  * Allow to asking for separate lists of services and images, fix ports output in services

Changes:
  * Ask for volumes in several inputs instead of comma separation
  * Ask for env vars in several inputs instead of comma separation
  * Ask for labels in several inputs instead of comma separation
  * Ask for ports in several inputs instead of comma separation
  * Ask for multiple values using sequential questions, not comma separated input during build

Fixes:
  * Do not display unmapped ports
  * Do not display images without tags in lists
