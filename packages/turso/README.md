# Turso

Manages Turso (libSQL/SQLite) cloud resources through the Turso Platform API: organizations, groups, databases, locations, API tokens, database auth tokens, members, invites, usage, invoices and audit logs.

Interface: OpenAPI, from Turso's official document at https://docs.turso.tech/api-reference/openapi.json (server https://api.turso.tech). The official document has no security scheme (`openapi.ts` supplies a bearer one) and uses property-level `$ref`s (for example `#/components/schemas/Database/properties/DbId`) that the compiler rejects, so `openapi.ts` embeds the same document with each of those refs replaced by the referenced property schema. Nothing else is changed. With OAuth, the official remote MCP server (https://mcp.turso.ai/mcp) is used instead, which adds SQL execution.

Auth:
- API token (`apiKey`): the Platform API tools. Create one with `turso auth api-tokens mint <name>` or `POST /v1/auth/api-tokens`.
- OAuth (`oauth`): Turso's MCP server advertises OAuth with dynamic client registration (authorization server https://api.turso.tech, PKCE S256), so no OAuth app needs to be created. An OAuth account gets the MCP tools only; an API token account gets the Platform API tools only. Turso has no user-created OAuth apps for the Platform API itself.

Known gaps: the per-database SQL-over-HTTP API (`https://<db>-<org>.turso.io`, a different host and per-database token) is not included; use OAuth and the MCP server for SQL. All 53 Platform API operations compile, none skipped.
