
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
