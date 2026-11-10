# Anvil

Covers Anvil's PDF fill and generation, Etch e-signature packets, workflows, webforms, casts (PDF templates) and organizations.

## Interface

Two interfaces, chosen by how the account signs in:

- **OAuth: official remote MCP server** at `https://mcp.useanvil.com` (streamable HTTP; docs: https://www.useanvil.com/docs/api/mcp/). Tools: `fill_pdf`, `generate_pdf`, `graphql_schema`, `graphql_query`, `list_organizations`, `select_organization`. This is the only route to the REST-only PDF fill/generate operations, and `graphql_schema` / `graphql_query` cover the GraphQL API. Tools that are not marked read-only require approval.
- **API key: GraphQL** at `https://graphql.useanvil.com` (docs: https://www.useanvil.com/docs/api/graphql/). Tools are generated from the schema by introspection once an account connects; Anvil does not document that introspection is enabled on this host, so the OAuth/MCP account is the dependable one. Every mutation requires approval.

## Auth

- **OAuth** (`oauth`): the MCP server publishes OAuth 2.0 metadata with dynamic client registration (scopes `mcp:full offline_access`). Connect and approve in Anvil; no client needs to be created by hand.
- **API key** (`apiKey`): create one in Anvil under Organization settings -> API keys (a development and a production key exist per organization). It is sent as HTTP Basic auth with the key as username and an empty password. The health check reads only `currentUser { eid }`.

## Known gaps

- Not verified with real credentials. Tool count with the API key depends on GraphQL introspection being available; the MCP tool list is fixed.
- Anvil's REST endpoints (fill PDF, generate PDF) are only reachable through the MCP account.
