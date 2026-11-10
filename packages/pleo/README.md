# Pleo

Find, update and prepare Pleo expenses through Pleo's official remote MCP server, acting with the connecting user's existing Pleo permissions.

## Interface

MCP server at `https://mcp.pleo.io/` (docs: https://developers.pleo.io/docs/current/getting-started/pleo-mcp-quickstart). Mutating tools require approval; tools annotated read-only do not.

Pleo's REST API (`https://external.pleo.io`) is not used: its OpenAPI documents are published only per reference page (the one standalone file, https://developers.pleo.io/openapi.json, covers 3 bookkeeping paths), and its OAuth 2.0 needs partner registration with Pleo.

## Auth

OAuth 2.0 with dynamic client registration and PKCE, discovered from `https://mcp.pleo.io/.well-known/oauth-authorization-server` (scope `authenticated`). There is no app to create. A Pleo company admin must first enable the MCP in Pleo under Settings > General > Pleo AI.

## Known gaps

- No API key method: Pleo's Standalone API Keys only work against the REST API, which is not covered here.
- Tool list is whatever the MCP server exposes to the signed-in user; it could not be listed without a Pleo account.
