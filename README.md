# Exoframe (alpha)

> Power armor for docker containers

## How it works

Exoframe intends to do all the heavy lifting required to build and deploy docker images for you.
To run it you need two parts - Exoframe CLI and [Exoframe server](https://github.com/exoframejs/exoframe-server).

It will detect your project type, pick fitting Dockerfile, ignore files that are not needed (e.g. logs, local build artifacts, etc), tag your image, add labels that reflect your ownership and much more.  
All of this happens completely automatically. So after running the command, the only thing you need to do is wait a few seconds until your files have been built or deployed!

## Installation and Usage

Install it (needs at least node v6):

```
npm install exoframe -g
```

Make sure you have [Exoframe server](https://github.com/exoframejs/exoframe-server) deployed, set it as your endpoint using:

```
exoframe endpoint http://you.server.url
```

Then use it:

```
exoframe <command> [options]
```

You can find a list of all commands and options below.

### Commands

| Command                | Description |
| ---------------------- | ----------- |
| completion             | Generates bash completion script  |
| endpoint <url>         | Sets the endpoint of Exoframe server |
| login                  | Login into Exoframe server |
| build                  | Build current folder into docker image |
| list                   | List owned images and running services |
| deploy <image>         | Deploy specified image using docker |
| status                 | Get Exoframe status and config |


## Contribute

1. Fork this repository to your own GitHub account and then clone it to your local device.
2. Uninstall exoframe if it's already installed: `npm uninstall exoframe -g`
3. Link it to the global module directory: `npm link`
4. Transpile the source code and watch for changes: `npm start`

Now can use the `exoframe` command everywhere.

## License

Licensed under MIT.
