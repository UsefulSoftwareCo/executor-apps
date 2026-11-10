# Make

Run Make scenarios and manage scenarios, connections, hooks, data stores, teams, organizations and the rest of the Make platform. Two surfaces are mounted under one app: `api` (the REST API, token accounts only) and `mcp` (the hosted MCP server). Every mutation and every MCP tool that is not read-only asks for approval.

**Interfaces**

- REST API (`api`, 401 tools, 214 of them mutations): Make's official Web API v2 at `https://<zone>/api/v2`. Make publishes no downloadable spec file; instead every endpoint page under https://developers.make.com/api-documentation/api-reference embeds an official OpenAPI 3.0.0 document ("Web API v2 - Public"). `rest-api.json` is those documents merged unchanged (paths and components, 407 operations, no conflicts), so refresh it by re-merging the pages when Make changes the API. Six operations with unsupported request bodies are skipped. The origin is set per account from the zone you enter. Auth is `Authorization: Token <api token>`.
- MCP (`mcp`): Make's official hosted MCP server, https://developers.make.com/mcp-server. Tools are discovered live and depend on the token's or consent screen's scopes (scenarios as tools need `mcp:use` on a token).

**Auth**

- OAuth (MCP only): the server publishes OAuth metadata with dynamic client registration and PKCE, so no OAuth app is needed. On the consent screen you choose the organization and the scopes; the vendor describes the scenario scope as "Run your scenarios" (all on-demand and active scenarios in the organization). The exact scope identifiers are only shown in an image in the docs, so none are requested by this app and any identifier such as `scenarios:read` is unverified. The REST API is not available to OAuth accounts: it accepts API tokens or Make-approved OAuth clients only.
- Token and zone (MCP and REST): in Make go to Profile > API access > Tokens > Add token, choose the scopes and a label. Include `mcp:use` to expose scenarios as MCP tools, and the `<resource>:read` / `<resource>:write` scopes (https://developers.make.com/api-documentation/authentication/api-scopes-overview) for the REST tools you want; `user:read` also lets the health check use the REST API. Enter the token with the zone hosting your organization (for example `eu2.make.com` or `us1.make.celonis.com`). The MCP endpoint is `https://<zone>/mcp` with `Authorization: Bearer <token>`, as on the vendor's overview and Cursor usage pages. The "Connect using MCP token" page instead puts the token in the URL (`https://<zone>/mcp/u/<token>`); Make's pages disagree, and the header form is used so the token never appears in a URL or log.

**Known gaps:** administration endpoints (`admin:*`) only work on Make White Label platforms. Scenario access through MCP still depends on your plan and scopes.
