# Semrush

SEO data from Semrush: domain overview, organic and paid keywords, competitors, keyword research (metrics, related, questions, difficulty) and backlink analytics.

## Interface

Three paths in one package, chosen by the account's auth method. Semrush publishes no OpenAPI document, so the API-key tools are hand-written.

- **v4 API key** (recommended for new integrations): 11 tools over the v4 APIs at `https://api.semrush.com/apis/v4/` (docs: https://developer.semrush.com/api/v4/). `keywordMetrics` (`keywords/v1/metrics`), and Backlinks (`backlinks/v1/`): `backlinksOverview`, `backlinks`, `backlinksRefDomains`, `backlinksRefIps`, `backlinksPages`, `backlinksAnchors`, `backlinksHistory`, `backlinksScoreProfile`, `backlinksCompetitors`, plus a generic `request` tool for any other `/apis/v4/` GET endpoint (for example the backlinks summary comparison and matrix reports). Responses are Semrush's JSON `{ meta, data }`.
- **v3 API key** (Standard API): 28 tools over `https://api.semrush.com/` and `https://api.semrush.com/analytics/v1/` (docs: https://developer.semrush.com/api/v3/), kept only where v4 has no equivalent: 11 domain reports, 9 keyword reports (everything except the single-keyword overview that v4 `keywordMetrics` replaces), the backlinks TLD and country distributions, `domainVsDomain`, `rank`, `rankDifference`, a generic `report` tool for any other v3 report type, and `apiUnits`. Responses are parsed from Semrush's semicolon CSV into `{ columns, rows }`. Every tool is read-only.
- **OAuth**: the official Semrush remote MCP server, `https://mcp.semrush.com/v2/mcp` (docs: https://developer.semrush.com/api/v4/introduction/semrush-mcp). Its tools come from the server; any tool without `readOnlyHint` asks for approval. Semrush's docs publish `/v2/mcp`; `/v1/mcp` still serves the same OAuth metadata but is not what the docs point to.

## Auth

- **v4 API key**: create it in Semrush (API access). Semrush says v4 uses either a v4 API key or OAuth and recommends a v4 key for new integrations. The key is sent as `Authorization: Apikey <key>`. v4 keys only work with v4 APIs, and v3 keys do not work with them, so the two key types are separate connection methods. v4 has no free balance endpoint; the health check sends a parameterless request and only fails on 401/403.
- **v3 API key**: find it in Semrush under Subscription info > API units. Calls spend API units, which are bought separately from a Semrush plan. The key is sent as the `key` query parameter, as Semrush documents. Health check is the free `countapiunits` call.
- **OAuth**: the MCP server supports dynamic client registration (issuer `https://oauth.semrush.com`, scopes `mcp.access` and `offline_access`, PKCE, no client secret), so Executor registers the client itself. `offline_access` is advertised in the authorization server's `scopes_supported` alongside the `refresh_token` grant, so it is requested to get a refresh token. Add Executor's redirect URI if Semrush asks for one (Semrush maintains a redirect URI allowlist). The protected-resource metadata lists `bearer_methods_supported: ["body"]`; the package sends `Authorization: Bearer`, which is the standard MCP form, but this has not been confirmed against a real OAuth connection.

## Costs

Tool descriptions state per-line API unit costs taken from Semrush's pages: v3 domain reports 10-100 units per line (`domain_domains` 80, 5x for historical data via `displayDate`), v3 backlink reports 40 per line, v4 keyword metrics 20 per request, v4 backlinks 20-45 per line (score profile 1). Several reports return up to 10,000 lines unless a limit is set, so set `displayLimit` (v3) or `limit` (v4). v3 keyword report prices were not confirmed and are not stated.

## Known gaps

- Semrush deprecated the v3 Keyword Reports (June 9, 2026) and v3 Backlinks (June 11, 2026) in favour of v4; they still work. The v3 tools that remain have no v4 equivalent. v4 currently documents only one keyword endpoint (Get Keyword Metrics), so keyword research beyond it (related, questions, SERP, difficulty batches) needs a v3 key or OAuth.
- The Trends API and Projects API are not wrapped on the key paths.
- v3 pages for PLA competitors, organic pages and subdomains, and the Authority Score and historical backlink reports were not readable; use the generic `report` tool for them.
- The v4 backlinks summary comparison and matrix endpoints were not readable; use the generic `request` tool.
