# Breeze

Project management in [Breeze](https://www.breeze.pm): projects, cards, lists, swimlanes, comments, todo lists and todos, time entries, activity and reports. Breeze documents 61 tools (20 read/search, 41 write) at https://www.breeze.pm/mcp.

## Interface

Breeze's official remote MCP server, `https://mcp.breeze.pm/mcp` (see https://www.breeze.pm/mcp). Breeze also has a REST API at `https://api.breeze.pm` (API token or basic auth, no OpenAPI document), but the MCP server covers more operations, so this package uses MCP only. Tools that are not read-only require approval.

## Auth

OAuth 2.0 through Breeze's identity server (`https://id.breeze.pm`), discovered from the MCP server's metadata with dynamic client registration, so no OAuth app needs to be created. Scopes: `read`, `write`, `offline_access`. The connection signs in as the user and follows their Breeze roles. Executor registers itself with Breeze at `https://id.breeze.pm/oauth/register` and supplies its own redirect URI, so there is nothing to enter.

There is no API key method: the MCP server accepts only OAuth.

## Known gaps

Per Breeze, assistants cannot create tags, set up custom fields, or change list and swimlane automations. Batch changes are capped at 25 items (10 for permanent deletes).
