# Neon

Manage Neon serverless Postgres: projects, branches, compute endpoints, databases, roles, operations, API keys, organizations, and the other management endpoints in Neon's API.

Interface: OpenAPI, from Neon's official document at https://neon.com/api_spec/release/v2.json (184 tools, none skipped). All calls go to https://console.neon.tech/api/v2. Tools are mounted under `api`; Neon's MCP server is mounted under `mcp` (see below). Every non-GET operation requires approval, including POST operations that only read (such as branch log queries and credential reveal).

## Auth

- API key: create a personal or organization API key in the Neon Console under Account settings > API keys (https://neon.com/docs/manage/api-keys). It is sent as a bearer token. The health check calls `GET /users/me`, which needs an account-level key. Project-scoped keys are not supported: Neon documents that they can only manage their one project and cannot perform account-level actions.

OAuth is not offered. Neon's OAuth is limited to registered partner integrations and has no self-service OAuth app creation.

## MCP (`mcp`)

Neon's official remote MCP server at https://mcp.neon.tech/mcp (Streamable HTTP), mounted under `mcp` with its own "Neon MCP" account. It adds what the management API lacks: running SQL and transactions, schema inspection and migrations, branch comparison and query tuning. Tools are listed live (the public listing at https://mcp.neon.tech/api/list-tools returned 114 tools in write mode; the count depends on readonly, projectId and category scoping). Every tool without `readOnlyHint` requires approval; that listing carries no annotations, so which tools skip approval cannot be confirmed without an authenticated session.

- API key: a personal or organization API key sent as a bearer token (the same kind of key as the `api` account).
- OAuth: the server supports dynamic client registration (RFC 7591) with PKCE S256, discovered from https://mcp.neon.tech/.well-known/oauth-authorization-server; no OAuth app has to be created and the redirect URI is registered automatically. These tokens only work for the MCP server, which is why `api` stays API-key only.
- Neon recommends the MCP server for development and testing only, not production databases (https://neon.com/docs/ai/neon-mcp-server). If IP Allow is enabled on a project, allow the hosted server's IPs `34.192.103.46` and `23.22.233.166`.

## Gaps

- The spec's cookie security schemes (console UI sessions) are ignored.
- The Neon Data API (per-branch, separate hosts) is not included.
- The MCP tool list was not enumerated with a real account.
