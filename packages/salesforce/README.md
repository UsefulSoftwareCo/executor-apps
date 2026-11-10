# Salesforce

Query and change Salesforce records (sObject CRUD), run invocable actions and flows, and browse the org's API catalog, as the signed-in user.

**Interface:** Salesforce's official hosted MCP servers (generally available since April 2026), all on `https://api.salesforce.com/platform/mcp/v1/platform/`:
`sobject-all` (records), `invocable-actions`, `flows` and `api-catalog`. Docs: https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/setup-overview.html

**Why not REST/OpenAPI:** Salesforce's REST and GraphQL APIs live on a per-org My Domain host, and Salesforce publishes no fixed-host OpenAPI document. The hosted MCP servers use one global host.

**Auth:** OAuth 2.0 with PKCE (`oauth`), scopes `mcp_api`, `refresh_token` and `offline_access`. Metadata and scopes are discovered from the MCP server. The authorization server metadata (login.salesforce.com/.well-known/oauth-authorization-server) advertises a `registration_endpoint`, so Executor may try dynamic client registration first; Salesforce's setup guidance (as reported by the developer blog and third-party guides, the vendor docs page itself returned HTTP 403 to us) says hosted MCP does not support it and expects an admin-created External Client App, which is the path this package expects. Create one in the org (Setup > App Manager > New External Client App): enable OAuth, add the redirect URI shown on Executor's connect page, select the `mcp_api` and `refresh_token` scopes, require PKCE and enable JWT-based access tokens for named users (both confirmed by the Salesforce Developers blog post on connecting Claude to hosted MCP servers), then enter its Consumer Key and Secret. Connected Apps do not work with hosted MCP. Each server must also be activated in Setup > API Catalog > MCP Servers (Salesforce Servers tab > Activate; inactive by default). Whether servers must additionally be linked to the app is unverified. One connection is assumed to authorize all four servers (they share an authorization server and scopes, but this is untested with a real account). Calls obey the user's object, field and sharing permissions.

**Approvals:** every tool not marked read-only asks first.

**Known gaps:**
- Production orgs only. Sandbox and scratch orgs use `/v1/sandbox/...` URLs, and My Domain-specific URLs (`/v1/d/<domain>/...`) are not offered.
- Other hosted servers (`data-360`, `prompt-builder`, `tableau-next`, `custom-servers`) are not mounted; their tools depend on licensed products.
- The icon is the Salesforce cloud logo from Wikimedia Commons; Simple Icons dropped it and salesforce.com offered no downloadable SVG.
- Tool counts depend on the org's configuration, so none are listed at deploy time.
