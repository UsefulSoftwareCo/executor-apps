# Rize

Rize is automatic time-tracking software. This package exposes Rize's public GraphQL API (time entries, projects, clients, tasks, sessions, team data and the rest of the schema) as Executor tools. Queries are read-only; every mutation requires approval.

- Interface: GraphQL at `https://api.rize.io/api/v1/graphql`, schema discovered by introspection (vendor docs: https://docs.rize.io/graphql-api/graphql-intro). Rize also runs an OAuth MCP server at `https://mcp.rize.io/mcp`; the GraphQL API is the broader, lower-level surface, so it is used instead.
- Auth: API key, sent as `Authorization: Bearer <key>`. Create it in the Rize dashboard under Settings > API (https://app.rize.io).
- OAuth: Rize offers no user-created OAuth apps for the GraphQL API (the MCP server's OAuth is dynamic client registration for MCP clients only), so only the API key method is provided.

Known gaps: none known; tool coverage follows whatever the schema exposes to the key's account.
