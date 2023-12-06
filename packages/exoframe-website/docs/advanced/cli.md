---
sidebar_position: 1
---

# Exoframe CLI

## Exoframe CLI - Commands

| Command                        | Description                                                          |
| ------------------------------ | -------------------------------------------------------------------- |
| config [options]               | Generate or update project config for current path                   |
| deploy [options] [folder]      | Deploy specified folder                                              |
| endpoint [switch, add, remove] | Manage endpoints of Exoframe server                                  |
| login [options]                | Login into Exoframe server                                           |
| list\|ls                       | List currently deployed projects                                     |
| logs\|log \<id\>               | Get logs for existing deployment or project                          |
| remove\|rm \<id\>              | Remove existing deployment or project                                |
| secret [add, ls, rm, get]      | Create, list, remove or get deployment secrets                       |
| setup [options] [recipe]       | Setup a complex recipe deployment                                    |
| system [command]               | Executes given system command (e.g. prune)                           |
| template [ls, rm]              | Add, list or remove deployment templates from the server             |
| token [add, ls, rm]            | Generate, list or remove deployment tokens                           |
| update [target]                | Gets current versions or updates given target (server, traefik, all) |

## Exoframe CLI - Special Commands

Exoframe CLI has a number of special commands, specifically:

- `exoframe logs exoframe-server` - will return current server logs (only works when running server as container)
