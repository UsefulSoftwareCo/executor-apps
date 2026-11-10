# Descript

Covers Descript, the audio and video editor: listing and fetching projects, importing media, running Underlord (project agent) jobs, tracking and cancelling jobs, exporting transcripts, publishing and searching.

Two interfaces, chosen by how the account is connected:

- **API token** uses Descript's official OpenAPI document (https://help.descript.com/developers/openapi.json, 14 operations, server `https://descriptapi.com/v1`). Create a personal API token in Descript under Settings, API Tokens. Mutations require approval.
- **OAuth** uses Descript's official remote MCP server, `https://api.descript.com/v2/mcp` (docs: https://help.descript.com/api-and-mcp/mcp-custom). The server advertises OAuth metadata with dynamic client registration (authorization server `https://auth.descript.com`), so no OAuth app needs to be created. Executor's redirect URI is registered automatically. MCP tools without `readOnlyHint` require approval.

OAuth scopes come from discovery, which requests `offline_access`. Executor registers as a third-party Stytch Connected App, and Stytch refuses `full_access` (listed only in auth.descript.com's OIDC document) for those clients with "An invalid scope has been requested". A live sign-in with `offline_access` alone listed all 15 MCP tools and refreshed the access token.

Known gaps: the two interfaces are exposed per account, not merged.
