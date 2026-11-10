# Dart

Tasks, docs, comments and workspace configuration in [Dart](https://www.dartai.com), the AI project management tool.

## Interface

Dart's official hosted MCP server, `https://mcp.dartai.com/mcp` (setup: https://help.dartai.com/en/articles/10733406). Dart's REST API schema is only served to authenticated users, so there is no public OpenAPI document to compile. Tools mirror the server's list (29 at the time of writing; `tools/list` answers without credentials, while tool calls need them); mutating tools require approval, tools annotated read-only do not.

## Auth

- OAuth: the server publishes OAuth metadata with dynamic client registration and PKCE (scopes `read`, `write`), so no OAuth app needs to be created. Approve on Dart's consent page; the redirect URI is the one Executor shows on the connect page.
- Token: a personal token from https://app.dartai.com/?settings=account, or a custom agent's token (agent menu, "Authentication token"; changes then appear as made by the agent). Sent as `Authorization: Bearer`. Dart's help center only documents the token via `mcp-remote` with a `DART_TOKEN` env var and never shows the header; a call with a bogus bearer returns `Invalid token.` from the Dart API (so the header is read as a token), but acceptance of a real token was not verified with a live credential.

## Known gaps

Only the tools the hosted MCP server exposes; the full REST API is not covered. The REST schema at app.dartai.com/api/openapi.json returns HTML, so no OpenAPI is used.
