---
sidebar_position: 1
---

# Exoframe CLI

## Exoframe CLI Commands

| Command                          | Description                                                            |
| -------------------------------- | ---------------------------------------------------------------------- |
| `config [options]`               | Generate or update the project config for the current path             |
| `deploy [options] [folder]`      | Deploy the specified folder                                            |
| `endpoint [switch, add, remove]` | Manage endpoints of the Exoframe server                                |
| `login [options]`                | Log into the Exoframe server                                           |
| `list\|ls`                       | List currently deployed projects                                       |
| `logs\|log \<id\>`               | Get logs for an existing deployment or project                         |
| `remove\|rm \<id\>`              | Remove an existing deployment or project                               |
| `secret [add, ls, rm, get]`      | Create, list, remove, or get deployment secrets                        |
| `setup [options] [recipe]`       | Set up a complex recipe deployment                                     |
| `system [command]`               | Execute a given system command (e.g., prune)                           |
| `template [ls, rm]`              | Add, list, or remove deployment templates from the server              |
| `token [add, ls, rm]`            | Generate, list, or remove deployment tokens                            |
| `update [target]`                | Get current versions or update the given target (server, traefik, all) |

## Exoframe CLI Special Commands

Exoframe CLI also includes several special commands:

- `exoframe logs exoframe-server` - Returns current server logs (only works when running the server as a container)
