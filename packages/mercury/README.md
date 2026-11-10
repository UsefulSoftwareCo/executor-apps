# Mercury

Mercury business banking for Executor: accounts, balances, transactions, cards, recipients, statements and treasury. Mercury's MCP server is in beta. This connection requests read scopes only; the server also offers write scopes (transactions:request, transfers:request, categories:create, categories:edit, transactions:update), which are not requested.
**Interface:** Mercury's official remote MCP server, `https://mcp.mercury.com/mcp`. The REST API (`https://api.mercury.com/api/v1`) is documented only as per-endpoint pages at https://docs.mercury.com/llms.txt, with no downloadable OpenAPI document, so it is not mounted.

**Auth:** OAuth 2.0 with dynamic client registration (the server publishes its metadata; Executor discovers it). Executor requests only the `read` and `offline_access` scopes, although the server also offers write scopes. Sign in with your Mercury account when connecting; the user must be able to authorize API/MCP access in Mercury (https://docs.mercury.com/docs/connecting-mercury-mcp). No client ID or secret is needed. Redirect URIs are registered automatically by dynamic registration; Mercury requires an https redirect URI for web-app registration, so connect from a hosted (https) Executor.

**Known gaps:** No REST API token (`https://app.mercury.com/settings/tokens`) support, and no money-movement or write tools, since only read scopes are requested. Tool count depends on what the server exposes at connect time.
