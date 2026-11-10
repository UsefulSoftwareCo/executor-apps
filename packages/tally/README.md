# Tally

Create and manage Tally forms: forms, questions and blocks, submissions, workspaces and folders, organization users and invites, webhooks and their events, and form analytics.

## Interface

OpenAPI. Tally's official document at https://developers.tally.so/api-reference/openapi.json (server `https://api.tally.so`), 38 tools of which 19 are mutations (all require approval). The spec has no operationIds, so tool names are method-based.

## Auth

- **API key** (`apiKey`): create one in Tally under Settings > API keys (https://tally.so/settings/api-keys). Keys look like `tly-...` and are sent as a bearer token.
- OAuth is not offered here. Tally documents OAuth only for its MCP server (https://developers.tally.so/api-reference/mcp, "Option 1: OAuth"); its authorization server metadata at https://api.tally.so/.well-known/oauth-authorization-server advertises dynamic client registration, PKCE S256 and scopes `user`, `forms`, `responses`, `webhooks`, `mcp`. The REST API docs (https://developers.tally.so/api-reference/api-keys) describe only API keys, and whether REST accepts OAuth tokens is unverified, so no `oauth2` method is declared.

## Approvals

All 19 non-GET operations require approval. `GET /users/me` also requires approval: its optional `timezone` query parameter updates the user's stored timezone, so the read has a side effect.

## Known gaps

- Tally also runs an MCP server at `https://api.tally.so/mcp`; the REST API is used here because it exposes more operations.
