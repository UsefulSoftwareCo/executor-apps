# Shortcut

Covers Shortcut's REST API v3: stories, epics, iterations, objectives, key results, labels, projects, groups (teams), workflows, docs, members, custom fields, files, linked files and search.

## Interface

OpenAPI (Swagger 2.0) from Shortcut's official document, https://developer.shortcut.com/api/rest/v3/shortcut.swagger.json. 143 tools, 73 of them mutations (each requires approval). Requests go to `https://api.app.shortcut.com`.

## Auth

API token only. Create one under Settings > Your Account > API Tokens in Shortcut (https://app.shortcut.com/settings/account/api-tokens). It is sent in the `Shortcut-Token` header. Shortcut's REST API does not offer OAuth for user-created apps, so none is declared (the hosted MCP server at https://mcp.shortcut.com/mcp uses OAuth but is not used here).

## Gaps

The token acts as the user who created it. The health check calls `GET /api/v3/member`.
