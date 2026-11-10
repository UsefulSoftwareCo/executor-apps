# Google Search Console

Search performance analytics (`searchAnalytics.query`), URL inspection, and management of verified sites and submitted sitemaps in Google Search Console. 10 tools.

## Interface

OpenAPI, generated from Google's official Search Console Discovery document (`https://searchconsole.googleapis.com/$discovery/rest?version=v1`, revision 20261011). Google publishes Discovery documents, not OpenAPI, so `convert-discovery.mjs` converts it to `openapi.json` (`node convert-discovery.mjs disc.json openapi.json`). It covers the sites (list, get, add, delete), sitemaps (list, get, submit, delete), `searchanalytics.query` and `urlInspection.index.inspect` methods. The Mobile-Friendly Test method was retired by Google and is left out. `searchanalytics.query` and `urlInspection.index.inspect` are POST operations that only read, so they run without approval; all other mutations require approval.

Google also hosts an official MCP endpoint at `https://searchconsole.googleapis.com/mcp` (OAuth through `accounts.google.com`, scopes `webmasters` and `webmasters.readonly`). Its `initialize` and `tools/list` can be called without credentials, and it exposes only 3 read-only tools: `query`, `sites_list` and `get`. The REST API is used instead because it covers 10 tools, including the 4 writes (add/delete site, submit/delete sitemap), which the MCP server lacks.

## Auth

OAuth 2.0 only. Discovery from `https://accounts.google.com`, scopes `openid email profile https://www.googleapis.com/auth/webmasters`, with `access_type=offline` and `prompt=consent` so a refresh token is issued. The `email` and `profile` scopes are kept for consistency with the sibling Google packages, although the health check only reads `sub` from userinfo. Google has no dynamic client registration: in Google Cloud Console enable the Search Console API, configure the OAuth consent screen, create a "Web application" OAuth client and add Executor's OAuth callback URL shown on the connect page as an authorized redirect URI. The connected Google user must be an owner or user of the Search Console properties.

## Known gaps

- No service account auth.
- Uses the full `webmasters` scope (needed for site and sitemap writes); `webmasters.readonly` is not offered separately.
- The Indexing API and the Search Console bulk data export are separate Google products and are not included.
