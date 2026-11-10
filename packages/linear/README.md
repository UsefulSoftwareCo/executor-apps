# Linear

Issues, projects, cycles, teams, comments and documents through Linear's official remote MCP server, mounted under `mcp`, plus the rest of Linear's GraphQL API for API-key accounts, mounted under `api`.

**Interface:** Linear's remote MCP server at https://mcp.linear.app/mcp (docs at https://linear.app/docs/mcp), and GraphQL at https://api.linear.app/graphql (tools from introspection). MCP tools are listed live; every tool without `readOnlyHint` asks for approval. Every GraphQL mutation asks for approval.

## Auth

- **OAuth** (`oauth`, first): the MCP server's own authorization server, discovered from its protected-resource metadata. It supports dynamic client registration and Client ID Metadata Documents, so no OAuth app has to be created. Scopes: `read write`, from the server's challenge. These tokens only work on the MCP server, so OAuth accounts get the `mcp` tools only.
- **Personal API key** (`apiKey`): create one in Linear under Settings > Security & access > Personal API keys. The MCP server takes it as a bearer token (per Linear's MCP docs) and GraphQL takes it as it is, so API-key accounts get both `mcp` and `api` tools. Health check: GraphQL `{ viewer { id name email } }`.

The earlier OAuth method on linear.app's own endpoints is gone: it needed a user-created Linear OAuth app.

## Known gaps

- Only unauthenticated probing of the MCP server was done (401 with valid OAuth metadata); its tool list is unverified.
- OAuth accounts have no GraphQL tools.
