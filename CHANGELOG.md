
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
