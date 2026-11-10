# Botpress

Build and manage Botpress Cloud agents: workspaces, bots, integrations, plugins, runtime conversations, messages and state, files and tables. 187 tools in four groups (`admin` 111, `runtime` 44, `files` 15, `tables` 17).

## Interface

Official OpenAPI documents published by Botpress in [botpress/docs](https://github.com/botpress/docs): `admin-openapi.json`, `runtime-openapi.json`, `files-openapi.json` and `tables-openapi.json`, loaded live from `raw.githubusercontent.com/botpress/docs/master/`. All four target `https://api.botpress.cloud`. Mutations require approval. The specs track the `master` branch of botpress/docs with no pinned commit, so a vendor change can alter tool shapes without a package change.

## Auth

Personal access token (Bearer). Create one in Botpress Cloud under Profile Settings (per the [Botpress authentication docs](https://botpress.com/docs/api-reference/authentication/)). The token has the same access as your user and has no configurable scopes. The docs list only token auth (PAT, Bot Access Key, Integration Access Key) and mention no OAuth.

Operations are scoped by header parameters that the tools expose as inputs: `x-workspace-id` for workspace-level admin operations (list workspaces first) and `x-bot-id` for runtime, files and tables operations.

## Known gaps

- The Chat API (`chat.botpress.cloud/{webhookUrl}`) is not included: it is addressed per bot webhook and uses no bearer token.
- The icon is the official Botpress mark from the docs favicon, with its dark tile removed so it works on light and dark backgrounds.
