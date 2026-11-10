# Plaid

Plaid's bank-connectivity and financial-data platform, in two parts: the REST API (`api`) for Link, Items, Auth, Balance, Transactions, Identity, Investments, Liabilities, Income, Transfer, Signal and the rest, and the Dashboard MCP server (`mcp`) for read-only Production diagnostics and analytics (Item debugging, Link conversion, usage and API volumes, team discovery). The catalog target "Plaid MCP" is the same product, so it is mounted here under `mcp`.

## Interfaces

- `api`: Plaid's official OpenAPI document, https://raw.githubusercontent.com/plaid/plaid-openapi/master/2020-09-14.yml (maintained by Plaid in `plaid/plaid-openapi`). 335 tools. Plaid's API is POST-only RPC: operations ending in get, list, search or sync run without approval, all others ask for approval. The spec's Plaid-Version header requirement is dropped, so Plaid serves its default API version.
- `mcp`: Plaid's official Dashboard MCP server, `https://api.dashboard.plaid.com/mcp/` (streamable HTTP). Tools: `plaid_debug_item`, `plaid_get_link_analytics`, `plaid_get_tools_introduction`, `plaid_get_usages`, `plaid_list_teams`. Tools not marked read-only ask for approval.

## Auth

- REST API, client ID and secret: copy them from Team Settings > Keys in the [Plaid Dashboard](https://dashboard.plaid.com/developers/keys). Enter the environment (`production` or `sandbox`) with them; it is fixed per connected account, so connect once per environment. Credentials are sent as `PLAID-CLIENT-ID` and `PLAID-SECRET` headers only to the matching Plaid host. The health check calls the read-only `/institutions/get`.
- Dashboard MCP, OAuth: the server publishes OAuth metadata and supports dynamic client registration with PKCE (scope `mcp:dashboard`), so no OAuth app has to be created. The authorization page is on dashboard.plaid.com. Plaid also documents a `client_credentials` grant with Production keys, which yields 15-minute tokens; that flow is not offered here.

## Known gaps

- 16 operations are skipped because they use a different authentication scheme than the client ID and secret.
- The REST API spec's operations are all served from the production or sandbox host; the retired `development` environment is not offered.
- The MCP server only works with Production data and requires Production approval for a Plaid product. Plaid labels it under active development.
- Link tokens and Link UI flows need a client application; the API tools only create tokens.
